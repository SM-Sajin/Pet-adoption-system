const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fallbackAuthController } = require('./fallbackController');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      console.warn('Register attempt with missing fields:', { name, email });
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.warn('Register attempt with existing email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }
    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });
    if (user) {
      const token = generateToken(user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token
      });
    } else {
      console.error('User creation failed:', { name, email });
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.log('Using fallback auth controller');
      return fallbackAuthController.register(req, res);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.warn('Login attempt with missing fields:', { email });
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.warn('Login failed: user not found for email', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn('Login failed: incorrect password for email', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.log('Using fallback auth controller');
      return fallbackAuthController.login(req, res);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      user.address = req.body.address || user.address;
      user.profileImage = req.body.profileImage || user.profileImage;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        isAdmin: updatedUser.isAdmin,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
}; 