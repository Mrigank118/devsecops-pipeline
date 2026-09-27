import { pool } from "../models/index.js";

// Helper Functions for Cart
// Check Product Availability
const checkProduct = async (product_id, qty) => {
    const { rows } = await pool.query('SELECT stock FROM products WHERE id = $1', [product_id]);
    return rows[0]?.stock >= qty || false;
};

// Check if product is already exists in the cart
const isProductInCart = async (user_id, product_id) => {
    const { rows } = await pool.query(
        `SELECT 1 FROM cart 
        WHERE user_id = $1 AND product_id = $2`, 
        [user_id, product_id]
    )
    return !!rows[0]
}

// Requests
// Save localStorage items to database when authenticated
const saveItems = async (req, res) => {
    const user_id = req.user.id
    const cartItems = req.body?.cartItems
    if (!Array.isArray(cartItems) || cartItems.length > 100) {
        return res.status(400).json({ success: false, message: "Cart must contain at most 100 items" })
    }
    const items = cartItems.map((item) => ({ productId: Number(item?.id), quantity: Number(item?.quantity) }))
    if (items.some(({ productId, quantity }) => !Number.isSafeInteger(productId) || productId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1)) {
        return res.status(400).json({ success: false, message: "Cart contains an invalid product or quantity" })
    }
    let client
    try {
        client = await pool.connect()
        await client.query('BEGIN')
        for (const { productId, quantity } of items) {
            const { rows } = await client.query(
                `INSERT INTO cart (user_id, product_id, quantity)
                 SELECT $1, p.id, $3 FROM products p WHERE p.id = $2 AND p.stock >= $3
                 ON CONFLICT (user_id, product_id) DO UPDATE
                 SET quantity = cart.quantity + EXCLUDED.quantity
                 WHERE cart.quantity + EXCLUDED.quantity <= (SELECT stock FROM products WHERE id = $2)
                 RETURNING product_id`,
                [user_id, productId, quantity]
            )
            if (!rows[0]) {
                const error = new Error("Product not found or insufficient stock")
                error.code = "CART_STOCK"
                throw error
            }
        }
        await client.query('COMMIT')
        res.status(201).json({ success: true, message: "Items successfully saved to the database." })
    } catch (error) {
        if (client) await client.query('ROLLBACK')
        if (error.code === "CART_STOCK") {
            return res.status(409).json({ success: false, message: error.message })
        }
        console.error('Saving cart failed:', error.message)
        res.status(500).json({ success: false, message: "Failed to save items to the database." })
    } finally {
        if (client) client.release()
    }
}

// Retrieving cart for specefic user
const getCart = async (req, res) => {
    const user_id = req.user.id
    try {
        const query = `
            SELECT c.product_id AS id, p.name , p.image, p.price, c.quantity
            FROM cart AS c
            JOIN products AS p
            ON c.product_id = p.id
            WHERE user_id = $1
        `
        const { rows: items } = await pool.query(query, [user_id])
        const itemCount = items.length;
        res.status(200).json({ data: items, itemCount })
    } catch (error) {
        res.status(404).json({ message: 'Cart not found' })
    }
}

// Add to cart
const addToCart = async (req, res) => {
    const user_id = req.user.id
    const product_id = req.params.product_id
    let quantity = Number(req.body?.quantity)

    // Validate product and quantity before the atomic stock-aware upsert.
    if (!Number.isSafeInteger(Number(product_id)) || Number(product_id) < 1) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }

    try {
    const { rows } = await pool.query(
        `INSERT INTO cart (user_id, product_id, quantity)
         SELECT $1, p.id, $3 FROM products p WHERE p.id = $2 AND p.stock >= $3
         ON CONFLICT (user_id, product_id) DO UPDATE
         SET quantity = cart.quantity + EXCLUDED.quantity
         WHERE cart.quantity + EXCLUDED.quantity <= (SELECT stock FROM products WHERE id = $2)
         RETURNING *`,
        [user_id, product_id, quantity]
    )
    if (!rows[0]) return res.status(409).json({ message: 'Product not found or insufficient stock' })
    res.status(201).json({ message: 'Item Added Successfully', data: rows[0] })
    } catch (error) {
        console.error('Adding cart item failed:', error.message)
        res.status(500).json({ message: 'Unable to add item to cart' })
    }
}

// Update Cart (Add, Update, or Delete based on quantity)
const updateCart = async (req, res) => {
    const user_id = req.user.id;
    const product_id = req.params.product_id;
    const quantity = Number(req.body?.quantity); // quantity sent from the front end

    // Validation: Ensure quantity is valid
    if (!Number.isSafeInteger(quantity) || quantity < 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }

    try {
        if (!Number.isSafeInteger(Number(product_id)) || Number(product_id) < 1) {
            return res.status(400).json({ message: 'Invalid product ID' })
        }
        // Check if product exists & has enough stock for adding or updating
        if (quantity > 0 && !await checkProduct(product_id, quantity)) {
            return res.status(404).json({ message: 'Product not found or insufficient stock' });
        }
        
        // Check if product already exists in cart
        if (await isProductInCart(user_id, product_id)) {
            if (quantity === 0) {
                // Remove item if quantity is 0
                await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [user_id, product_id]);
                return res.status(200).json({ message: `Item removed from cart.` });
            } else {
                // Update quantity
                const updateQuery = `UPDATE cart c SET quantity = $1
                    FROM products p WHERE c.user_id = $2 AND c.product_id = $3
                    AND p.id = c.product_id AND p.stock >= $1 RETURNING c.*`;
                const { rows } = await pool.query(updateQuery, [quantity, user_id, product_id]);
                if (!rows[0]) return res.status(409).json({ message: 'Product not found or insufficient stock' });
                return res.status(200).json({ message: 'Quantity updated', data: rows[0] });
            }
        } else if (quantity > 0) {
            // Add new item to cart
            const insertQuery = `
                INSERT INTO cart (user_id, product_id, quantity)
                VALUES ($1, $2, $3)
                RETURNING *;
            `;
            const { rows } = await pool.query(insertQuery, [user_id, product_id, quantity]);
            return res.status(201).json({ message: 'Item added to cart', data: rows[0] });
        }
    } catch (error) {
        console.error('Cart update failed:', error.message);
        res.status(500).json({ message: 'Error updating cart' });
    }
};

const deleteFromCart = async (req, res) => {
    const user_id = req.user.id
    const product_id = req.params.product_id

    try {
        await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [user_id, product_id])
        return res.status(200).json({ message: 'Item deleted from cart' })
    } catch (error) {
        console.error('Cart deletion failed:', error.message);
        return res.status(500).json({ message: 'Error deleting from cart' })
    }
}

export { saveItems, getCart, addToCart, updateCart, deleteFromCart }
