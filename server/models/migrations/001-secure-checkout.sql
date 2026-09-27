-- Apply once to databases created before Stripe webhook-backed orders.
ALTER TABLE checkouts ALTER COLUMN order_id DROP NOT NULL;
ALTER TABLE checkouts
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;
UPDATE checkouts c SET user_id = o.user_id
FROM orders o WHERE c.order_id = o.id AND c.user_id IS NULL;
ALTER TABLE checkouts
    ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS checkouts_stripe_session_unique
    ON checkouts (stripe_session_id);

-- Merge legacy duplicate cart rows before enforcing the upsert key.
WITH grouped AS (
    SELECT c.user_id, c.product_id, MIN(c.id) AS keep_id, SUM(c.quantity) AS quantity
    FROM cart c
    WHERE c.user_id IS NOT NULL AND c.product_id IS NOT NULL
    GROUP BY c.user_id, c.product_id
), merged AS (
    UPDATE cart c SET quantity = g.quantity
    FROM grouped g WHERE c.id = g.keep_id
    RETURNING c.user_id, c.product_id, c.id
)
DELETE FROM cart c
USING merged m
WHERE c.user_id = m.user_id AND c.product_id = m.product_id AND c.id <> m.id;

CREATE UNIQUE INDEX IF NOT EXISTS cart_user_product_unique
    ON cart (user_id, product_id);
