const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get transactions by account ID
router.get('/:accountId', (req, res) => {
    const accountId = req.params.accountId;

    db.query(
        'SELECT * FROM Transactions WHERE account_id = ?',
        [accountId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Server Error');
            }
            res.json(results);
        }
    );
});

module.exports = router;