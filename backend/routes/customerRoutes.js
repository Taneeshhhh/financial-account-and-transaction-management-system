const express = require('express');
const router = express.Router();
const { requireAuth, requireCustomer } = require('../middleware/authMiddleware');

const {
    getCustomers,
    getCustomerById,
    getMyDashboard,
    updateMyProfile
} = require('../controllers/customerController');

router.get('/me/dashboard', requireAuth, requireCustomer, getMyDashboard);
router.put('/me/profile', requireAuth, requireCustomer, updateMyProfile);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);

module.exports = router;
