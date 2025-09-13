const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  sendAdoptionMessage,
  getReceivedMessages,
  getSentMessages,
  markAsRead,
  getUnreadCount
} = require('../controllers/adoptionMessageController');

// All routes require authentication
router.use(auth);

// Send adoption inquiry message
router.post('/send', sendAdoptionMessage);

// Get received messages (for pet owners)
router.get('/received', getReceivedMessages);

// Get sent messages (for potential adopters)
router.get('/sent', getSentMessages);

// Mark message as read
router.put('/:messageId/read', markAsRead);

// Get unread message count
router.get('/unread-count', getUnreadCount);

module.exports = router;
