const express = require('express');
const router = express.Router();
const { 
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
} = require('../controllers/petController');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer storage config (store in uploads/ with unique name)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Public routes
router.get('/', getAllPets);
router.get('/search', searchPets);

// User's pets (must come before /:id)
router.get('/my-pets', auth, getMyPets);

// Wishlist routes (must come before /:id)
router.get('/wishlist', auth, getWishlist);

// Pet by ID (must come after specific routes)
router.get('/:id', getPetById);

// Protected routes
router.post('/', auth, upload.array('images', 5), createPet);
router.put('/:id', auth, updatePet);
router.delete('/:id', auth, deletePet);

// Pet status management (owner only)
router.put('/:id/status', auth, updatePetStatus);

// Wishlist routes
router.post('/:id/wishlist', auth, addToWishlist);
router.delete('/:id/wishlist', auth, removeFromWishlist);

module.exports = router; 