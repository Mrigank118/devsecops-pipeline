import { pool } from "../models/index.js";

// Retrieving orders for user
const getOrders = async (req, res) => {
    // Ensure the user is authenticated
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    
    const user_id = req.user.id
    try {
        const { rows } = await pool.query('SELECT * FROM orders WHERE user_id = $1', [user_id])
        res.status(200).json({ data: rows })
    } catch (error) {
        console.error('Order retrieval failed:', error.message)
        res.status(500).json({ message: 'Error while retrieving orders' })
    }
}

// Retrieving order items
const getOrderDetails = async (req, res) => {
    // Ensure the user is authenticated
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized access' });
    }
    
    const order_id = req.params.order_id
    try{
        const query = `
            SELECT 
                o.order_id, 
                p.name, 
                o.quantity, 
                o.unit_price, 
                (o.quantity * o.unit_price) AS total_price
            FROM 
                orderitems AS o
            JOIN 
                products AS p
            ON 
                o.product_id = p.id
            JOIN orders AS ord ON ord.id = o.order_id
            WHERE o.order_id = $1 AND ord.user_id = $2
        `
        const { rows } = await pool.query(query, [order_id, req.user.id])
        res.status(200).json({ data: rows })
    } catch (error) {
        console.error('Order detail retrieval failed:', error.message)
        res.status(500).json({ message: 'Error while retrieving order details' })
    }
}

// You can add admin endpoint for updating status, for canceling order etc.

export { getOrders, getOrderDetails }
