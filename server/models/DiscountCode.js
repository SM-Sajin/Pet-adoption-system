const mongoose = require('mongoose');

const discountCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  minAdoptionFee: {
    type: Number,
    default: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicablePetTypes: [{
    type: String,
    enum: ['dog', 'cat', 'rabbit', 'fish', 'bird', 'other']
  }],
  applicablePetAges: [{
    type: String,
    enum: ['puppy', 'young', 'adult', 'senior']
  }],
  userRestrictions: {
    firstTimeAdopters: {
      type: Boolean,
      default: false
    },
    specificUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
discountCodeSchema.index({ code: 1 });
discountCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
discountCodeSchema.index({ usageLimit: 1, usedCount: 1 });

// Method to check if code is valid
discountCodeSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive &&
         now >= this.validFrom &&
         now <= this.validUntil &&
         (this.usageLimit === null || this.usedCount < this.usageLimit);
};

// Method to apply discount
discountCodeSchema.methods.calculateDiscount = function(adoptionFee) {
  if (!this.isValid() || adoptionFee < this.minAdoptionFee) {
    return 0;
  }

  let discount = 0;
  if (this.type === 'percentage') {
    discount = (adoptionFee * this.value) / 100;
  } else {
    discount = this.value;
  }

  // Apply max discount limit if set
  if (this.maxDiscount !== null && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }

  return Math.min(discount, adoptionFee); // Can't discount more than the fee
};

module.exports = mongoose.model('DiscountCode', discountCodeSchema); 