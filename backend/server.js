const express = require('express');
const cors = require('cors');
const db = require('./config/db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("Financial Management System API running");
});
app.get('/test-db', (req, res) => {
    db.query('SELECT 1', (err, result) => {
        if (err) {
            return res.status(500).send("DB Error");
        }
        res.send("Database connected successfully");
    });
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const customerRoutes = require('./routes/customerRoutes');
app.use('/api/customers', customerRoutes);

const accountRoutes = require('./routes/accountRoutes');
app.use('/api/accounts', accountRoutes);

const transactionRoutes = require('./routes/transactionRoutes');
app.use('/api/transactions', transactionRoutes);

const fraudRoutes = require('./routes/fraudRoutes');
app.use('/api/fraud', fraudRoutes);