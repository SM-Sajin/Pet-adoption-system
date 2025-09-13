const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Create a review
router.post('/', auth, reviewController.createReview);

// Get reviews for a specific user
router.get('/:userId', reviewController.getUserReviews);

module.exports = router;


