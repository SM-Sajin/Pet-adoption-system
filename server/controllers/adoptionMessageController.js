const AdoptionMessage = require('../models/AdoptionMessage');
const User = require('../models/User');
const Pet = require('../models/Pet');

// Send an adoption inquiry message
const sendAdoptionMessage = async (req, res) => {
  try {
    const { petId, subject, content } = req.body;

    if (!petId || !content) {
      return res.status(400).json({ message: 'Pet ID and content are required' });
    }

    // Get the pet and its owner
    const pet = await Pet.findById(petId).populate('owner', 'name email');
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if user is trying to message themselves
    if (String(pet.owner._id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot send a message to yourself' });
    }

    // Check if pet is available for adoption
    if (pet.adoptionStatus !== 'available') {
      return res.status(400).json({ message: 'This pet is not available for adoption' });
    }

    const message = await AdoptionMessage.create({
      sender: req.user._id,
      recipient: pet.owner._id,
      pet: petId,
      subject: subject || 'Adoption Inquiry',
      content
    });

    await message.populate([
      { path: 'sender', select: 'name email profileImage' },
      { path: 'recipient', select: 'name email profileImage' },
      { path: 'pet', select: 'name images breed type' }
    ]);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send adoption message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get received adoption messages (for pet owners)
const getReceivedMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { recipient: req.user._id };
    if (status) {
      query.status = status;
    }

    const messages = await AdoptionMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sender', 'name email profileImage')
      .populate('pet', 'name images breed type adoptionStatus');

    const total = await AdoptionMessage.countDocuments(query);

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get received messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get sent adoption messages (for potential adopters)
const getSentMessages = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await AdoptionMessage.find({ sender: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('recipient', 'name email profileImage')
      .populate('pet', 'name images breed type adoptionStatus');

    const total = await AdoptionMessage.countDocuments({ sender: req.user._id });

    res.json({
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await AdoptionMessage.findOneAndUpdate(
      { _id: messageId, recipient: req.user._id },
      { 
        $set: { 
          readAt: new Date(),
          status: 'read'
        } 
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const count = await AdoptionMessage.countDocuments({
      recipient: req.user._id,
      readAt: null
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendAdoptionMessage,
  getReceivedMessages,
  getSentMessages,
  markAsRead,
  getUnreadCount
};
