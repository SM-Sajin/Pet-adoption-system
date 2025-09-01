const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const discountController = require('../controllers/discountController');

// Create discount code (admin only)
router.post('/', auth, discountController.createDiscountCode);

// Get all discount codes (admin only)
router.get('/admin', auth, discountController.getAllDiscountCodes);

// Get discount code statistics (admin only)
router.get('/stats', auth, discountController.getDiscountCodeStats);

// Get specific discount code
router.get('/:id', discountController.getDiscountCodeById);

// Update discount code (admin only)
router.put('/:id', auth, discountController.updateDiscountCode);

// Delete discount code (admin only)
router.delete('/:id', auth, discountController.deleteDiscountCode);

// Validate discount code (authenticated users)
router.post('/validate', auth, discountController.validateDiscountCode);

// Get active discount codes (public)
router.get('/', discountController.getActiveDiscountCodes);

module.exports = router; 