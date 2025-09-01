const memoryStorage = require('../utils/memoryStorage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Fallback Auth Controller
const fallbackAuthController = {
  // Register user
  register: async (req, res) => {
    try {
      const { name, email, password, phone } = req.body;

      // Check if user already exists
      const existingUser = memoryStorage.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = memoryStorage.createUser({
        name,
        email,
        password: hashedPassword,
        phone,
        isAdmin: false,
        averageRating: 0,
        totalReviews: 0,
        wishlist: []
      });

      const token = generateToken(user._id);
      
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: user.isAdmin,
        token
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Login user
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = memoryStorage.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
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
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get user profile
  getProfile: async (req, res) => {
    try {
      const user = memoryStorage.findUserById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const user = memoryStorage.findUserById(req.user._id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updates = { ...req.body };
      
      // Hash password if it's being updated
      if (updates.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(updates.password, salt);
      }

      const updatedUser = memoryStorage.updateUser(req.user._id, updates);
      
      const token = generateToken(updatedUser._id);
      
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        profileImage: updatedUser.profileImage,
        isAdmin: updatedUser.isAdmin,
        token
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

// Fallback Pet Controller
const fallbackPetController = {
  // Create a new pet listing
  createPet: async (req, res) => {
    try {
      const petData = {
        ...req.body,
        owner: req.user._id,
        adoptionStatus: 'available'
      };

      const pet = memoryStorage.createPet(petData);
      
      // Add owner info
      const owner = memoryStorage.findUserById(pet.owner);
      pet.owner = {
        _id: owner._id,
        name: owner.name,
        email: owner.email
      };
      
      res.status(201).json(pet);
    } catch (error) {
      console.error('Create pet error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all available pets
  getAllPets: async (req, res) => {
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
      if (breed) filter.breed = breed;
      if (size) filter.size = size;
      if (gender) filter.gender = gender;
      if (minAge || maxAge) {
        filter.age = {};
        if (minAge) filter.age.$gte = parseInt(minAge);
        if (maxAge) filter.age.$lte = parseInt(maxAge);
      }

      const allPets = memoryStorage.findPets(filter);
      
      // Apply pagination
      const startIndex = (parseInt(page) - 1) * parseInt(limit);
      const endIndex = startIndex + parseInt(limit);
      const pets = allPets.slice(startIndex, endIndex);

      // Add owner info to pets
      const petsWithOwner = pets.map(pet => {
        const owner = memoryStorage.findUserById(pet.owner);
        return {
          ...pet,
          owner: owner ? {
            _id: owner._id,
            name: owner.name
          } : { name: 'Unknown' }
        };
      });

      res.json({
        pets: petsWithOwner,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(allPets.length / parseInt(limit)),
          totalPets: allPets.length,
          hasNextPage: endIndex < allPets.length,
          hasPrevPage: parseInt(page) > 1
        }
      });
    } catch (error) {
      console.error('Get all pets error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get pet by ID
  getPetById: async (req, res) => {
    try {
      const pet = memoryStorage.findPetById(req.params.id);
      
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Increment views
      pet.views += 1;
      memoryStorage.updatePet(req.params.id, { views: pet.views });

      // Add owner info
      const owner = memoryStorage.findUserById(pet.owner);
      pet.owner = owner ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone
      } : { name: 'Unknown' };

      res.json(pet);
    } catch (error) {
      console.error('Get pet by ID error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update pet listing
  updatePet: async (req, res) => {
    try {
      const pet = memoryStorage.findPetById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Check if user is the owner or admin
      if (pet.owner !== req.user._id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      const updatedPet = memoryStorage.updatePet(req.params.id, req.body);
      
      // Add owner info
      const owner = memoryStorage.findUserById(updatedPet.owner);
      updatedPet.owner = {
        _id: owner._id,
        name: owner.name,
        email: owner.email
      };

      res.json(updatedPet);
    } catch (error) {
      console.error('Update pet error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete pet listing
  deletePet: async (req, res) => {
    try {
      const pet = memoryStorage.findPetById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Check if user is the owner or admin
      if (pet.owner !== req.user._id && !req.user.isAdmin) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      memoryStorage.deletePet(req.params.id);
      res.json({ message: 'Pet removed' });
    } catch (error) {
      console.error('Delete pet error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Search pets
  searchPets: async (req, res) => {
    try {
      const { q, type, breed, size, gender } = req.query;

      let filter = { adoptionStatus: 'available' };

      // Text search
      if (q) {
        // Simple text search implementation
        const allPets = memoryStorage.findPets(filter);
        const searchResults = allPets.filter(pet => 
          pet.name.toLowerCase().includes(q.toLowerCase()) ||
          pet.breed.toLowerCase().includes(q.toLowerCase()) ||
          pet.description.toLowerCase().includes(q.toLowerCase())
        );
        
        // Add owner info
        const petsWithOwner = searchResults.map(pet => {
          const owner = memoryStorage.findUserById(pet.owner);
          return {
            ...pet,
            owner: owner ? {
              _id: owner._id,
              name: owner.name
            } : { name: 'Unknown' }
          };
        });

        return res.json(petsWithOwner.slice(0, 20));
      }

      // Other filters
      if (type) filter.type = type;
      if (breed) filter.breed = breed;
      if (size) filter.size = size;
      if (gender) filter.gender = gender;

      const pets = memoryStorage.findPets(filter);
      
      // Add owner info
      const petsWithOwner = pets.map(pet => {
        const owner = memoryStorage.findUserById(pet.owner);
        return {
          ...pet,
          owner: owner ? {
            _id: owner._id,
            name: owner.name
          } : { name: 'Unknown' }
        };
      });

      res.json(petsWithOwner.slice(0, 20));
    } catch (error) {
      console.error('Search pets error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update pet adoption status
  updatePetStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const pet = memoryStorage.findPetById(req.params.id);

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Check if user is the owner
      if (pet.owner !== req.user._id) {
        return res.status(403).json({ message: 'Only the pet owner can update status' });
      }

      // Validate status
      const validStatuses = ['available', 'pending', 'adopted'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      const updatedPet = memoryStorage.updatePet(req.params.id, { adoptionStatus: status });
      
      // Add owner info
      const owner = memoryStorage.findUserById(updatedPet.owner);
      updatedPet.owner = {
        _id: owner._id,
        name: owner.name,
        email: owner.email
      };

      res.json({
        message: 'Pet status updated successfully',
        pet: updatedPet
      });
    } catch (error) {
      console.error('Update pet status error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Add pet to wishlist
  addToWishlist: async (req, res) => {
    try {
      const pet = memoryStorage.findPetById(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Check if already in wishlist
      if (pet.wishlistedBy && pet.wishlistedBy.includes(req.user._id)) {
        return res.status(400).json({ message: 'Pet already in wishlist' });
      }

      // Initialize wishlistedBy array if it doesn't exist
      if (!pet.wishlistedBy) {
        pet.wishlistedBy = [];
      }

      pet.wishlistedBy.push(req.user._id);
      memoryStorage.updatePet(req.params.id, { wishlistedBy: pet.wishlistedBy });

      res.json({ message: 'Added to wishlist successfully' });
    } catch (error) {
      console.error('Add to wishlist error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Remove pet from wishlist
  removeFromWishlist: async (req, res) => {
    try {
      const pet = memoryStorage.findPetById(req.params.id);
      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Remove from wishlist
      if (pet.wishlistedBy) {
        pet.wishlistedBy = pet.wishlistedBy.filter(userId => userId !== req.user._id);
        memoryStorage.updatePet(req.params.id, { wishlistedBy: pet.wishlistedBy });
      }

      res.json({ message: 'Removed from wishlist successfully' });
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get user's wishlist
  getWishlist: async (req, res) => {
    try {
      const allPets = memoryStorage.findPets({});
      const wishlistPets = allPets.filter(pet => 
        pet.wishlistedBy && pet.wishlistedBy.includes(req.user._id)
      );

      // Add owner info
      const petsWithOwner = wishlistPets.map(pet => {
        const owner = memoryStorage.findUserById(pet.owner);
        return {
          ...pet,
          owner: owner ? {
            _id: owner._id,
            name: owner.name
          } : { name: 'Unknown' }
        };
      });

      res.json(petsWithOwner);
    } catch (error) {
      console.error('Get wishlist error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get user's pets
  getMyPets: async (req, res) => {
    try {
      const allPets = memoryStorage.findPets({});
      const myPets = allPets.filter(pet => pet.owner === req.user._id);

      // Add owner info
      const petsWithOwner = myPets.map(pet => {
        const owner = memoryStorage.findUserById(pet.owner);
        return {
          ...pet,
          owner: owner ? {
            _id: owner._id,
            name: owner.name,
            email: owner.email
          } : { name: 'Unknown' }
        };
      });

      res.json(petsWithOwner);
    } catch (error) {
      console.error('Get my pets error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
};

module.exports = {
  fallbackAuthController,
  fallbackPetController
}; 