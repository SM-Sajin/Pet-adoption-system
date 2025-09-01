const mongoose = require('mongoose');

const adoptionApplicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
    default: 'pending'
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  pickupOptions: {
    method: {
      type: String,
      enum: ['shelter', 'foster_home', 'vet_clinic', 'delivery'],
      default: 'shelter'
    },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String
    },
    scheduledDate: Date,
    notes: String
  },
  adoptionFee: {
    originalAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    discountCode: {
      type: String,
      default: null
    }
  },
  applicationDetails: {
    experience: {
      type: String,
      required: true
    },
    livingSituation: {
      type: String,
      required: true
    },
    otherPets: {
      type: String,
      required: true
    },
    children: {
      type: String,
      required: true
    },
    workSchedule: {
      type: String,
      required: true
    },
    reasonForAdoption: {
      type: String,
      required: true
    }
  },
  adminNotes: {
    type: String,
    default: ''
  },
  reviewDate: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
adoptionApplicationSchema.index({ user: 1, status: 1 });
adoptionApplicationSchema.index({ pet: 1, status: 1 });
adoptionApplicationSchema.index({ status: 1, applicationDate: -1 });

module.exports = mongoose.model('AdoptionApplication', adoptionApplicationSchema); 