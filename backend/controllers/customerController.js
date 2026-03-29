const db = require('../config/db');

// GET ALL CUSTOMERS
exports.getCustomers = (req, res) => {
    db.query('SELECT * FROM Customers', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
};

// GET CUSTOMER BY ID
exports.getCustomerById = (req, res) => {
    const { id } = req.params;

    db.query(
        'SELECT * FROM Customers WHERE customer_id = ?',
        [id],
        (err, results) => {
            if (err) return res.status(500).send(err);
            res.json(results[0]);
        }
    );
};