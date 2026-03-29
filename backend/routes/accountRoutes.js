const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    db.query('SELECT * FROM Accounts', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server Error');
        }
        res.json(results);
    });
});

module.exports = router;