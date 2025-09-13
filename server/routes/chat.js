const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const chatController = require('../controllers/chatController');

// Send message
router.post('/message', auth, chatController.sendMessage);

// Get conversation with a specific user
router.get('/conversation/:userId', auth, chatController.getConversation);

// Get chat contacts
router.get('/contacts', auth, chatController.getContacts);

// Mark messages as read for a conversation
router.post('/conversation/:userId/read', auth, chatController.markAsRead);

module.exports = router;


