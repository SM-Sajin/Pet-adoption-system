const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true
  },
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'withdrawn'],
    default: 'pending'
  },
  personalInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true,
      min: 18
    },
    occupation: {
      type: String,
      trim: true
    }
  },
  homeEnvironment: {
    homeType: {
      type: String,
      enum: ['apartment', 'house', 'condo', 'townhouse'],
      required: true
    },
    hasYard: {
      type: Boolean,
      default: false
    },
    yardSize: String,
    hasFence: {
      type: Boolean,
      default: false
    },
    otherPets: [{
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'other', 'none']
    }],
    children: {
      hasChildren: {
        type: Boolean,
        default: false
      },
      ages: [Number]
    }
  },
  experience: {
    hasPetExperience: {
      type: Boolean,
      default: false
    },
    experienceDescription: String,
    previousPets: [{
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'other']
    }]
  },
  lifestyle: {
    workSchedule: {
      type: String,
      enum: ['full-time', 'part-time', 'flexible', 'work-from-home'],
      required: true
    },
    timeAtHome: {
      type: String,
      enum: ['less-than-4-hours', '4-8-hours', '8-12-hours', 'more-than-12-hours'],
      required: true
    },
    exercisePlan: String,
    trainingPlan: String
  },
  motivation: {
    reasonForAdoption: {
      type: String,
      required: true,
      trim: true
    },
    expectations: String,
    commitment: {
      type: String,
      enum: ['short-term', 'long-term', 'lifetime'],
      required: true
    }
  },
  financial: {
    canAffordVet: {
      type: Boolean,
      required: true
    },
    canAffordFood: {
      type: Boolean,
      required: true
    },
    emergencyFund: {
      type: Boolean,
      default: false
    }
  },
  references: [{
    name: String,
    relationship: String,
    phone: String,
    email: String
  }],
  additionalNotes: String,
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
applicationSchema.index({ pet: 1, applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema); 