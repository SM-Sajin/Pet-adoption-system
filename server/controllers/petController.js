const Pet = require('../models/Pet');
const { fallbackPetController } = require('./fallbackController');
const mongoose = require('mongoose');

// @desc    Create a new pet listing
// @route   POST /api/pets
// @access  Private
const createPet = async (req, res) => {
  // Always use fallback if MongoDB is not connected
  if (mongoose.connection.readyState !== 1) {
    return fallbackPetController.createPet(req, res);
  }
  try {
    // Support both file uploads and image URLs
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => `/uploads/${file.filename}`);
    } else if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        images = req.body.images;
      } else if (typeof req.body.images === 'string') {
        images = [req.body.images];
      }
    }

    const {
      name,
      type,
      breed,
      age,
      ageUnit,
      gender,
      size,
      color,
      description,
      healthStatus,
      temperament,
      goodWith,
      location,
      adoptionFee
    } = req.body;

    // Create new pet
    const pet = new Pet({
      name,
      type,
      breed,
      age,
      ageUnit,
      gender,
      size,
      color,
      description,
      images,
      healthStatus,
      temperament,
      goodWith,
      location,
      adoptionFee,
      owner: req.user._id
    });

    const savedPet = await pet.save();
    await savedPet.populate('owner', 'name email');

    // Return only essential fields for lightweight response
    res.status(201).json({
      _id: savedPet._id,
      name: savedPet.name,
      images: savedPet.images,
      type: savedPet.type,
      breed: savedPet.breed,
      age: savedPet.age,
      gender: savedPet.gender,
      size: savedPet.size,
      description: savedPet.description,
      adoptionStatus: savedPet.adoptionStatus,
      owner: savedPet.owner
    });
  } catch (error) {
    console.error('Create pet error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.log('Using fallback pet controller');
      return fallbackPetController.createPet(req, res);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all available pets
// @route   GET /api/pets
// @access  Public
const getAllPets = async (req, res) => {
  // Always use fallback if MongoDB is not connected
  if (mongoose.connection.readyState !== 1) {
    return fallbackPetController.getAllPets(req, res);
  }
  try {
    const { 
      type, 
      breed, 
      size, 
      gender, 
      minAge, 
      maxAge,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = { adoptionStatus: 'available' };
    
    if (type) filter.type = type;
    if (breed) filter.breed = { $regex: breed, $options: 'i' };
    if (size) filter.size = size;
    if (gender) filter.gender = gender;
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = parseInt(minAge);
      if (maxAge) filter.age.$lte = parseInt(maxAge);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get pets with pagination, only select essential fields
    const pets = await Pet.find(filter)
      .select('name images type breed age gender size description adoptionStatus owner')
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Pet.countDocuments(filter);

    res.json({
      pets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalPets: total,
        hasNextPage: skip + pets.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all pets error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.log('Using fallback pet controller');
      return fallbackPetController.getAllPets(req, res);
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pet by ID
// @route   GET /api/pets/:id
// @access  Public
const getPetById = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id)
      .populate('owner', 'name email phone averageRating totalReviews')
      .populate('wishlistedBy', 'name');

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Increment views
    pet.views += 1;
    await pet.save();

    res.json(pet);
  } catch (error) {
    console.error('Get pet by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update pet listing
// @route   PUT /api/pets/:id
// @access  Private (owner only)
const updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if user is the owner or admin
    if (pet.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update pet fields
    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    res.json(updatedPet);
  } catch (error) {
    console.error('Update pet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete pet listing
// @route   DELETE /api/pets/:id
// @access  Private (owner only)
const deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if user is the owner or admin
    if (pet.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Pet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Pet removed' });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search pets
// @route   GET /api/pets/search
// @access  Public
const searchPets = async (req, res) => {
  try {
    const { q, type, breed, size, gender } = req.query;

    let filter = { adoptionStatus: 'available' };

    // Text search
    if (q) {
      filter.$text = { $search: q };
    }

    // Other filters
    if (type) filter.type = type;
    if (breed) filter.breed = { $regex: breed, $options: 'i' };
    if (size) filter.size = size;
    if (gender) filter.gender = gender;

    const pets = await Pet.find(filter)
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(pets);
  } catch (error) {
    console.error('Search pets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update pet adoption status
// @route   PUT /api/pets/:id/status
// @access  Private (owner only)
const updatePetStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if user is the owner
    if (pet.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the pet owner can update status' });
    }

    // Validate status
    const validStatuses = ['available', 'pending', 'adopted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    pet.adoptionStatus = status;
    await pet.save();

    await pet.populate('owner', 'name email');

    res.json({
      message: 'Pet status updated successfully',
      pet
    });
  } catch (error) {
    console.error('Update pet status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add pet to wishlist
// @route   POST /api/pets/:id/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if already in wishlist
    if (pet.wishlistedBy.includes(req.user._id)) {
      return res.status(400).json({ message: 'Pet already in wishlist' });
    }

    pet.wishlistedBy.push(req.user._id);
    await pet.save();

    res.json({ message: 'Added to wishlist successfully' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove pet from wishlist
// @route   DELETE /api/pets/:id/wishlist
// @access  Private
const removeFromWishlist = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Remove from wishlist
    pet.wishlistedBy = pet.wishlistedBy.filter(
      userId => userId.toString() !== req.user._id.toString()
    );
    await pet.save();

    res.json({ message: 'Removed from wishlist successfully' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/pets/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const pets = await Pet.find({ wishlistedBy: req.user._id })
      .populate('owner', 'name')
      .sort({ createdAt: -1 });

    res.json(pets);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's pets (for status management)
// @route   GET /api/pets/my-pets
// @access  Private
const getMyPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user._id })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(pets);
  } catch (error) {
    console.error('Get my pets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createPet,
  getAllPets,
  getPetById,
  updatePet,
  deletePet,
  searchPets,
  updatePetStatus,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  getMyPets
}; 