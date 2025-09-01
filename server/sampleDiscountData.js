const DiscountCode = require('./models/DiscountCode');
const User = require('./models/User');

const SAMPLE_DISCOUNT_CODES = [
  {
    code: 'FIRSTTIME20',
    name: 'First Time Adopter Discount',
    description: '20% off for first-time pet adopters',
    type: 'percentage',
    value: 20,
    minAdoptionFee: 50,
    maxDiscount: 100,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: null,
    applicablePetTypes: ['dog', 'cat', 'rabbit'],
    applicablePetAges: ['puppy', 'young', 'adult', 'senior'],
    userRestrictions: {
      firstTimeAdopters: true,
      specificUsers: []
    }
  },
  {
    code: 'SENIOR50',
    name: 'Senior Pet Special',
    description: '$50 off adoption of senior pets (7+ years)',
    type: 'fixed_amount',
    value: 50,
    minAdoptionFee: 100,
    maxDiscount: 50,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: null,
    applicablePetTypes: ['dog', 'cat'],
    applicablePetAges: ['senior'],
    userRestrictions: {
      firstTimeAdopters: false,
      specificUsers: []
    }
  },
  {
    code: 'SUMMER25',
    name: 'Summer Adoption Special',
    description: '25% off all adoptions during summer',
    type: 'percentage',
    value: 25,
    minAdoptionFee: 30,
    maxDiscount: 75,
    validFrom: new Date('2024-06-01'),
    validUntil: new Date('2024-08-31'),
    usageLimit: 100,
    applicablePetTypes: ['dog', 'cat', 'rabbit', 'fish', 'bird'],
    applicablePetAges: ['puppy', 'young', 'adult', 'senior'],
    userRestrictions: {
      firstTimeAdopters: false,
      specificUsers: []
    }
  },
  {
    code: 'WELCOME10',
    name: 'Welcome Discount',
    description: '$10 off for new users',
    type: 'fixed_amount',
    value: 10,
    minAdoptionFee: 20,
    maxDiscount: 10,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usageLimit: 1,
    applicablePetTypes: ['dog', 'cat', 'rabbit', 'fish', 'bird'],
    applicablePetAges: ['puppy', 'young', 'adult', 'senior'],
    userRestrictions: {
      firstTimeAdopters: false,
      specificUsers: []
    }
  }
];

async function loadSampleDiscountCodes() {
  try {
    // Get the first admin user to set as creator
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log('No admin user found for creating discount codes');
      return;
    }

    // Clear existing discount codes
    await DiscountCode.deleteMany({});

    // Create sample discount codes
    for (const discountData of SAMPLE_DISCOUNT_CODES) {
      const discountCode = new DiscountCode({
        ...discountData,
        createdBy: adminUser._id
      });
      await discountCode.save();
    }

    console.log('Sample discount codes loaded successfully!');
  } catch (error) {
    console.error('Error loading sample discount codes:', error);
  }
}

module.exports = { loadSampleDiscountCodes }; 