const db = require('../config/db');

// GET transactions by account
exports.getTransactionsByAccount = (req, res) => {
    const { accountId } = req.params;

    db.query(
        'SELECT * FROM Transactions WHERE account_id = ?',
        [accountId],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results);
        }
    );
};

// GET detailed transaction view (JOIN)
exports.getTransactionDetails = (req, res) => {
    const { accountId } = req.params;

    const query = `
        SELECT 
            c.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            a.account_id,
            a.account_type,
            t.transaction_id,
            t.transaction_type,
            t.transaction_amount,
            t.transaction_date
        FROM Customers c
        JOIN Accounts a ON c.customer_id = a.customer_id
        JOIN Transactions t ON a.account_id = t.account_id
        WHERE a.account_id = ?
    `;

    db.query(query, [accountId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
};