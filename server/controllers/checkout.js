import { pool } from "../models/index.js";

export const createCheckoutSession = (stripe) => async (req, res) => {
  if (!stripe) return res.status(503).json({ message: "Payments are not configured" });

  try {
    const frontendOrigin = new URL(process.env.FRONT_DOMAIN || "http://localhost:3001").origin;
    const { rows } = await pool.query(
      `SELECT c.product_id, c.quantity, p.stripe_price_id, p.stock, p.price
       FROM cart c JOIN products p ON p.id = c.product_id
       WHERE c.user_id = $1 ORDER BY c.product_id`,
      [req.user.id]
    );
    if (!rows.length) return res.status(400).json({ message: "Cart is empty" });
    if (rows.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > item.stock)) {
      return res.status(409).json({ message: "Cart contains an invalid quantity or an item with insufficient stock" });
    }
    if (rows.some((item) => !item.stripe_price_id)) {
      return res.status(503).json({ message: "A cart item is not configured for payment" });
    }
    const uniquePrices = [...new Set(rows.map((item) => item.stripe_price_id))];
    const prices = await Promise.all(uniquePrices.map((priceId) => stripe.prices.retrieve(priceId)));
    if (prices.some((price) => !price.active || price.currency !== "usd" ||
      price.unit_amount !== Math.round(Number(rows.find((item) => item.stripe_price_id === price.id).price) * 100))) {
      return res.status(503).json({ message: "A payment price does not match the product catalog" });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: rows.map(({ stripe_price_id, quantity }) => ({ price: stripe_price_id, quantity })),
      client_reference_id: String(req.user.id),
      metadata: { user_id: String(req.user.id) },
      success_url: `${frontendOrigin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendOrigin}/cart?canceled=true`,
    });

    await pool.query(
      `INSERT INTO checkouts (user_id, order_id, amount, status, method, stripe_session_id)
       VALUES ($1, NULL, $2, 'pending', 'card', $3)`,
      [req.user.id, (checkoutSession.amount_total || 0) / 100, checkoutSession.id]
    );
    res.status(201).json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Unable to create Stripe checkout session:", error.message);
    res.status(502).json({ message: "Unable to start checkout" });
  }
};

export const getCheckoutStatus = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.status, c.order_id FROM checkouts c
       WHERE c.stripe_session_id = $1 AND c.user_id = $2`,
      [req.params.session_id, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Checkout not found" });
    return res.json({ status: rows[0].status, orderId: rows[0].order_id });
  } catch (error) {
    console.error("Checkout status lookup failed:", error.message);
    return res.status(500).json({ message: "Unable to retrieve checkout status" });
  }
};

// Stripe is the source of truth for payment completion. Never place an order
// based on a browser redirect, which a client can forge.
export const handleStripeWebhook = (stripe) => async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send("Payment webhook is not configured");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.warn("Rejected Stripe webhook with invalid signature");
    return res.status(400).send("Invalid webhook signature");
  }

  if (event.type !== "checkout.session.completed") return res.sendStatus(200);
  const session = event.data.object;
  if (session.payment_status !== "paid") return res.sendStatus(200);

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const { rows: checkoutRows } = await client.query(
      "SELECT id, user_id, order_id, status FROM checkouts WHERE stripe_session_id = $1 FOR UPDATE",
      [session.id]
    );
    if (!checkoutRows[0]) {
      await client.query("ROLLBACK");
      return res.status(500).send("Checkout session is not registered yet");
    }
    if (checkoutRows[0].order_id) {
      await client.query("COMMIT");
      return res.sendStatus(200);
    }
    if (checkoutRows[0].status === "failed") {
      await client.query("COMMIT");
      return res.sendStatus(200);
    }

    const refundAndStop = async () => {
      const paymentIntent = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
      if (!paymentIntent) throw new Error("Paid session has no payment intent to refund");
      await stripe.refunds.create(
        { payment_intent: paymentIntent },
        { idempotencyKey: `inventory-refund-${session.id}` }
      );
      await client.query("UPDATE checkouts SET status = 'failed' WHERE id = $1", [checkoutRows[0].id]);
      await client.query("COMMIT");
      return res.sendStatus(200);
    };

    const userId = Number(session.metadata?.user_id || session.client_reference_id);
    if (!Number.isSafeInteger(userId) || userId < 1 || userId !== checkoutRows[0].user_id) {
      return await refundAndStop();
    }
    const { data: stripeItems } = await stripe.checkout.sessions.listLineItems(
      session.id, { limit: 100, expand: ["data.price"] }
    );
    if (!stripeItems.length) return await refundAndStop();

    const items = [];
    for (const line of stripeItems) {
      const quantity = line.quantity;
      if (!Number.isSafeInteger(quantity) || quantity < 1 || !line.price?.id || line.price.currency !== "usd") {
        return await refundAndStop();
      }
      const { rows } = await client.query(
        "SELECT id, price, stock FROM products WHERE stripe_price_id = $1 FOR UPDATE",
        [line.price.id]
      );
      const product = rows[0];
      if (!product || product.stock < quantity) {
        return await refundAndStop();
      }
      if (line.price.unit_amount !== Math.round(Number(product.price) * 100)) {
        return await refundAndStop();
      }
      items.push({ product_id: product.id, quantity, unit_price: product.price });
    }

    const total = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
    if (session.amount_total !== Math.round(total * 100)) return await refundAndStop();
    const { rows: orders } = await client.query(
      "INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, 'pending') RETURNING id",
      [userId, total.toFixed(2)]
    );
    const orderId = orders[0].id;
    for (const item of items) {
      const stockUpdate = await client.query(
        "UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND stock >= $1",
        [item.quantity, item.product_id]
      );
      if (stockUpdate.rowCount !== 1) throw new Error("Inventory changed during payment processing");
      await client.query(
        "INSERT INTO orderitems (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, item.product_id, item.quantity, item.unit_price]
      );
      // Preserve items added to the cart after checkout started.
      await client.query(
        "DELETE FROM cart WHERE user_id = $1 AND product_id = $2 AND quantity <= $3",
        [userId, item.product_id, item.quantity]
      );
      await client.query(
        "UPDATE cart SET quantity = quantity - $1 WHERE user_id = $2 AND product_id = $3 AND quantity > $1",
        [item.quantity, userId, item.product_id]
      );
    }
    await client.query(
      "UPDATE checkouts SET order_id = $1, status = 'completed' WHERE id = $2",
      [orderId, checkoutRows[0].id]
    );
    await client.query("COMMIT");
    return res.sendStatus(200);
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    console.error("Stripe webhook processing failed:", error.message);
    return res.status(500).send("Webhook processing failed");
  } finally {
    if (client) client.release();
  }
};
