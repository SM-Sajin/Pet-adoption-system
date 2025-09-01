const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'other']
  },
  breed: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0
  },
  ageUnit: {
    type: String,
    enum: ['months', 'years'],
    default: 'months'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    required: true
  },
  size: {
    type: String,
    enum: ['small', 'medium', 'large'],
    required: true
  },
  color: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    required: true
  }],
  healthStatus: {
    vaccinated: {
      type: Boolean,
      default: false
    },
    spayedNeutered: {
      type: Boolean,
      default: false
    },
    microchipped: {
      type: Boolean,
      default: false
    },
    specialNeeds: {
      type: Boolean,
      default: false
    },
    specialNeedsDescription: String
  },
  temperament: [{
    type: String,
    enum: ['friendly', 'playful', 'calm', 'energetic', 'shy', 'protective', 'independent', 'social']
  }],
  goodWith: {
    children: {
      type: Boolean,
      default: false
    },
    dogs: {
      type: Boolean,
      default: false
    },
    cats: {
      type: Boolean,
      default: false
    }
  },
  adoptionStatus: {
    type: String,
    enum: ['available', 'pending', 'adopted'],
    default: 'available'
  },
  location: {
    city: String,
    state: String,
    zipCode: String
  },
  adoptionFee: {
    type: Number,
    default: 0,
    min: 0
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  wishlistedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  applications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  }]
}, {
  timestamps: true
});

// Index for search functionality
petSchema.index({ name: 'text', breed: 'text', description: 'text' });

// Virtual for formatted age
petSchema.virtual('formattedAge').get(function() {
  if (this.ageUnit === 'months' && this.age >= 12) {
    const years = Math.floor(this.age / 12);
    const months = this.age % 12;
    return months > 0 ? `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}` : `${years} year${years > 1 ? 's' : ''}`;
  }
  return `${this.age} ${this.ageUnit}`;
});

// Ensure virtual fields are serialized
petSchema.set('toJSON', { virtuals: true });
petSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Pet', petSchema); 