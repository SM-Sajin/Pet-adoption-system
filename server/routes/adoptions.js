const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adoptionController = require('../controllers/adoptionController');

// Create adoption application (authenticated users)
router.post('/', auth, adoptionController.createAdoptionApplication);

// Get user's adoption applications (authenticated users)
router.get('/user', auth, adoptionController.getUserApplications);

// Get all applications (admin only)
router.get('/admin', auth, adoptionController.getAllApplications);

// Update application status (admin only)
router.put('/:id/status', auth, adoptionController.updateApplicationStatus);

// Cancel application (authenticated users)
router.put('/:id/cancel', auth, adoptionController.cancelApplication);

// Get specific application by ID (authenticated users)
router.get('/:id', auth, adoptionController.getApplicationById);

module.exports = router; 