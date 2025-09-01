const DiscountCode = require('../models/DiscountCode');
const AdoptionApplication = require('../models/AdoptionApplication');

// Create discount code (admin only)
const createDiscountCode = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const {
      code,
      name,
      description,
      type,
      value,
      minAdoptionFee,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      applicablePetTypes,
      applicablePetAges,
      userRestrictions
    } = req.body;

    // Check if code already exists
    const existingCode = await DiscountCode.findOne({ 
      code: code.toUpperCase() 
    });
    if (existingCode) {
      return res.status(400).json({ message: 'Discount code already exists' });
    }

    const discountCode = new DiscountCode({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value,
      minAdoptionFee: minAdoptionFee || 0,
      maxDiscount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit,
      applicablePetTypes: applicablePetTypes || [],
      applicablePetAges: applicablePetAges || [],
      userRestrictions: userRestrictions || {},
      createdBy: req.user.id
    });

    await discountCode.save();

    res.status(201).json({
      message: 'Discount code created successfully',
      discountCode
    });

  } catch (error) {
    console.error('Create discount code error:', error);
    res.status(500).json({ message: 'Error creating discount code' });
  }
};

// Get all discount codes (admin only)
const getAllDiscountCodes = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const discountCodes = await DiscountCode.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DiscountCode.countDocuments(query);

    res.json({
      discountCodes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all discount codes error:', error);
    res.status(500).json({ message: 'Error fetching discount codes' });
  }
};

// Get discount code by ID
const getDiscountCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const discountCode = await DiscountCode.findById(id)
      .populate('createdBy', 'name');

    if (!discountCode) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    res.json(discountCode);

  } catch (error) {
    console.error('Get discount code error:', error);
    res.status(500).json({ message: 'Error fetching discount code' });
  }
};

// Update discount code (admin only)
const updateDiscountCode = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Don't allow updating the code field to prevent conflicts
    delete updateData.code;

    const discountCode = await DiscountCode.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!discountCode) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    await discountCode.populate('createdBy', 'name');

    res.json({
      message: 'Discount code updated successfully',
      discountCode
    });

  } catch (error) {
    console.error('Update discount code error:', error);
    res.status(500).json({ message: 'Error updating discount code' });
  }
};

// Delete discount code (admin only)
const deleteDiscountCode = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { id } = req.params;

    const discountCode = await DiscountCode.findByIdAndDelete(id);
    if (!discountCode) {
      return res.status(404).json({ message: 'Discount code not found' });
    }

    res.json({ message: 'Discount code deleted successfully' });

  } catch (error) {
    console.error('Delete discount code error:', error);
    res.status(500).json({ message: 'Error deleting discount code' });
  }
};

// Validate discount code
const validateDiscountCode = async (req, res) => {
  try {
    const { code, petId, adoptionFee } = req.body;
    const userId = req.user.id;

    const discountCode = await DiscountCode.findOne({ 
      code: code.toUpperCase() 
    });

    if (!discountCode) {
      return res.status(404).json({ message: 'Invalid discount code' });
    }

    if (!discountCode.isValid()) {
      return res.status(400).json({ message: 'Discount code is not valid' });
    }

    // Check if user is eligible
    const isFirstTimeAdopter = await AdoptionApplication.countDocuments({
      user: userId,
      status: 'completed'
    }) === 0;

    let isEligible = true;
    let eligibilityReason = '';

    // Check user restrictions
    if (discountCode.userRestrictions.firstTimeAdopters && !isFirstTimeAdopter) {
      isEligible = false;
      eligibilityReason = 'This discount is only for first-time adopters';
    }

    if (discountCode.userRestrictions.specificUsers.length > 0 &&
        !discountCode.userRestrictions.specificUsers.includes(userId)) {
      isEligible = false;
      eligibilityReason = 'This discount is not available for your account';
    }

    // Check minimum adoption fee
    if (adoptionFee < discountCode.minAdoptionFee) {
      isEligible = false;
      eligibilityReason = `Minimum adoption fee of $${discountCode.minAdoptionFee} required`;
    }

    if (!isEligible) {
      return res.status(400).json({ 
        message: eligibilityReason 
      });
    }

    // Calculate discount
    const discountAmount = discountCode.calculateDiscount(adoptionFee);
    const finalAmount = adoptionFee - discountAmount;

    res.json({
      isValid: true,
      discountCode: {
        name: discountCode.name,
        description: discountCode.description,
        type: discountCode.type,
        value: discountCode.value
      },
      calculation: {
        originalAmount: adoptionFee,
        discountAmount,
        finalAmount
      }
    });

  } catch (error) {
    console.error('Validate discount code error:', error);
    res.status(500).json({ message: 'Error validating discount code' });
  }
};

// Get active discount codes for public view
const getActiveDiscountCodes = async (req, res) => {
  try {
    const discountCodes = await DiscountCode.find({ 
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    }).select('name description validUntil applicablePetTypes applicablePetAges');

    res.json(discountCodes);

  } catch (error) {
    console.error('Get active discount codes error:', error);
    res.status(500).json({ message: 'Error fetching active discount codes' });
  }
};

// Get discount code statistics (admin only)
const getDiscountCodeStats = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalCodes = await DiscountCode.countDocuments();
    const activeCodes = await DiscountCode.countDocuments({ isActive: true });
    const expiredCodes = await DiscountCode.countDocuments({
      validUntil: { $lt: new Date() }
    });

    const mostUsedCodes = await DiscountCode.find()
      .sort({ usedCount: -1 })
      .limit(5)
      .select('code name usedCount');

    const recentCodes = await DiscountCode.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('code name createdAt isActive');

    res.json({
      totalCodes,
      activeCodes,
      expiredCodes,
      mostUsedCodes,
      recentCodes
    });

  } catch (error) {
    console.error('Get discount code stats error:', error);
    res.status(500).json({ message: 'Error fetching discount code statistics' });
  }
};

module.exports = {
  createDiscountCode,
  getAllDiscountCodes,
  getDiscountCodeById,
  updateDiscountCode,
  deleteDiscountCode,
  validateDiscountCode,
  getActiveDiscountCodes,
  getDiscountCodeStats
}; 