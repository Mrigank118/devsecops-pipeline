import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "../models/index.js";
import { createCheckoutSession } from "../controllers/checkout.js";

const makeResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("checkout validates Stripe price against the database catalog", async () => {
  const unique = randomUUID();
  const email = `checkout-ci-${unique}@example.test`;
  const sessionId = `cs_ci_${unique.replaceAll("-", "")}`;
  const { rows: users } = await pool.query(
    "INSERT INTO users (full_name, email) VALUES ($1, $2) RETURNING id",
    ["Checkout CI Test", email]
  );
  const userId = users[0].id;

  try {
    const { rows: products } = await pool.query(
      "SELECT id, price, stripe_price_id FROM products WHERE stock > 0 AND stripe_price_id IS NOT NULL ORDER BY id LIMIT 1"
    );
    assert.ok(products[0], "CI database must include a stocked Stripe catalog product");
    const product = products[0];
    await pool.query(
      "INSERT INTO cart (user_id, product_id, quantity) VALUES ($1, $2, 1)",
      [userId, product.id]
    );

    const expectedAmount = Math.round(Number(product.price) * 100);
    const matchingStripe = {
      prices: {
        retrieve: async (id) => ({
          id,
          active: true,
          currency: "usd",
          unit_amount: expectedAmount,
        }),
      },
      checkout: {
        sessions: {
          create: async (options) => {
            assert.deepEqual(options.line_items, [
              { price: product.stripe_price_id, quantity: 1 },
            ]);
            return {
              id: sessionId,
              url: "https://checkout.example.test/session",
              amount_total: expectedAmount,
            };
          },
        },
      },
    };

    const success = makeResponse();
    await createCheckoutSession(matchingStripe)({ user: { id: userId } }, success);
    assert.equal(success.statusCode, 201);
    assert.equal(success.body.url, "https://checkout.example.test/session");

    const mismatchStripe = {
      prices: {
        retrieve: async (id) => ({
          id,
          active: true,
          currency: "usd",
          unit_amount: expectedAmount + 1,
        }),
      },
      checkout: {
        sessions: {
          create: async () => assert.fail("Stripe session must not be created for a mismatched price"),
        },
      },
    };
    const mismatch = makeResponse();
    await createCheckoutSession(mismatchStripe)({ user: { id: userId } }, mismatch);
    assert.equal(mismatch.statusCode, 503);
    assert.match(mismatch.body.message, /price does not match/i);
  } finally {
    await pool.query("DELETE FROM checkouts WHERE user_id = $1", [userId]);
    await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  }
});

test.after(async () => pool.end());
