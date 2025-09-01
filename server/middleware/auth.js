const jwt = require('jsonwebtoken');
const User = require('../models/User');
const memoryStorage = require('../utils/memoryStorage');
const mongoose = require('mongoose');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.warn('Auth middleware: No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('Auth middleware: Invalid token');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Try MongoDB first
    let user = null;
    if (mongoose.connection.readyState === 1) {
      try {
        user = await require('../models/User').findById(decoded.userId).select('-password');
      } catch (err) {
        // If ObjectId cast fails, fallback to memory
        user = null;
      }
    }
    // Fallback to in-memory storage if MongoDB is down or user not found
    if (!user) {
      user = memoryStorage.findUserById(decoded.userId);
      if (user) {
        // Remove password before attaching to req
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        return next();
      }
    }
    if (!user) {
      console.warn('Auth middleware: User not found for token');
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
      }
      next();
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { auth, adminAuth }; 