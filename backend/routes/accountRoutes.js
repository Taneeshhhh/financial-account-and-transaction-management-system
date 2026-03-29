const express = require('express');
const router = express.Router();

const {
    getAccounts,
    getAccountById,
    getAccountDetails
} = require('../controllers/accountController');

router.get('/', getAccounts);
router.get('/details/:id', getAccountDetails);
router.get('/:id', getAccountById);

module.exports = router;