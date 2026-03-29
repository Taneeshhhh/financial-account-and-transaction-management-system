const express = require('express');
const router = express.Router();

const {
    getTransactionsByAccount,
    getTransactionDetails
} = require('../controllers/transactionController');

router.get('/details/:accountId', getTransactionDetails);
router.get('/:accountId', getTransactionsByAccount);

module.exports = router;