const Message = require('../models/Message');
const User = require('../models/User');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, petId } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'recipientId and content are required' });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      pet: petId || null,
      content
    });

    await message.populate([
      { path: 'sender', select: 'name profileImage' },
      { path: 'recipient', select: 'name profileImage' },
      { path: 'pet', select: 'name images' }
    ]);

    // Emit socket event if io is available
    try {
      const { io } = require('../server');
      io.to(String(recipientId)).emit('chat:new_message', message);
    } catch (e) {
      // ignore socket errors
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversation with a user
const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    const query = {
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage')
      .populate('pet', 'name images');

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// List chat contacts (distinct users you have messaged with)
const getContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const lastMessages = await Message.aggregate([
      { $match: { $or: [ { sender: userId }, { recipient: userId } ] } },
      { $sort: { createdAt: -1 } },
      { $group: { 
          _id: { 
            participants: {
              $cond: [
                { $gt: ['$sender', '$recipient'] },
                ['$recipient', '$sender'],
                ['$sender', '$recipient']
              ]
            }
          },
          lastMessage: { $first: '$$ROOT' }
        } 
      },
      { $replaceRoot: { newRoot: '$lastMessage' } }
    ]);

    const contactIds = new Set();
    lastMessages.forEach(m => {
      contactIds.add(String(m.sender) === String(userId) ? String(m.recipient) : String(m.sender));
    });

    const contacts = await User.find({ _id: { $in: Array.from(contactIds) } })
      .select('name profileImage averageRating totalReviews');

    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark messages from a contact as read
const markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    await Message.updateMany(
      { sender: userId, recipient: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendMessage, getConversation, getContacts, markAsRead };


