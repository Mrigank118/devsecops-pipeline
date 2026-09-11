import Stripe from "stripe";
import pg from "pg";

const { Pool } = pg;

const stripe = new Stripe(process.env.STRIPE_SECRET);

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

async function main() {
  const { rows: products } = await pool.query(`
    SELECT id, name, description, price
    FROM products
    ORDER BY id
  `);

  console.log(`Found ${products.length} products.`);

  for (const product of products) {
    console.log(`\nProcessing: ${product.name}`);

    const existing = await stripe.products.search({
      query: `metadata['local_product_id']:'${product.id}'`,
    });

    let stripeProduct;

    if (existing.data.length > 0) {
      stripeProduct = existing.data[0];
      console.log(`Stripe product already exists: ${stripeProduct.id}`);
    } else {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          local_product_id: String(product.id),
        },
      });

      console.log(`Created Stripe product: ${stripeProduct.id}`);
    }

    const existingPrices = await stripe.prices.list({
      product: stripeProduct.id,
      active: true,
      limit: 100,
    });

    let stripePrice = existingPrices.data.find(
      (p) =>
        p.unit_amount === Math.round(Number(product.price) * 100) &&
        p.currency === "usd"
    );

    if (!stripePrice) {
      stripePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: Math.round(Number(product.price) * 100),
        currency: "usd",
      });

      console.log(`Created Stripe price: ${stripePrice.id}`);
    } else {
      console.log(`Stripe price already exists: ${stripePrice.id}`);
    }

    await pool.query(
      `
      UPDATE products
      SET stripe_price_id = $1
      WHERE id = $2
      `,
      [stripePrice.id, product.id]
    );

    console.log(`Database updated: ${stripePrice.id}`);
  }

  console.log("\nStripe test catalog setup complete.");
}

main()
  .catch((error) => {
    console.error("ERROR:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
