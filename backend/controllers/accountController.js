const db = require('../config/db');

// GET ALL ACCOUNTS
exports.getAccounts = (req, res) => {
    db.query('SELECT * FROM Accounts', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
};

// GET ACCOUNT BY ID
exports.getAccountById = (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM Accounts WHERE account_id = ?',
        [id],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results[0]);
        }
    );
};

// JOIN (ACCOUNT + CUSTOMER)
exports.getAccountDetails = (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT 
            a.account_id,
            a.account_type,
            a.balance,
            c.customer_id,
            CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
            c.email
        FROM Accounts a
        JOIN Customers c ON a.customer_id = c.customer_id
        WHERE a.account_id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
};