const AdoptionApplication = require('../models/AdoptionApplication');
const Pet = require('../models/Pet');
const User = require('../models/User');
const DiscountCode = require('../models/DiscountCode');

// Create adoption application
const createAdoptionApplication = async (req, res) => {
  try {
    const {
      petId,
      pickupOptions,
      applicationDetails,
      discountCode
    } = req.body;

    const userId = req.user.id;

    // Check if pet exists and is available
    const pet = await Pet.findById(petId);
    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    // Check if user already has a pending application for this pet
    const existingApplication = await AdoptionApplication.findOne({
      user: userId,
      pet: petId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: 'You already have an active application for this pet' 
      });
    }

    // Calculate adoption fee and apply discount
    let originalAmount = pet.adoptionFee;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let appliedDiscountCode = null;

    if (discountCode) {
      const discount = await DiscountCode.findOne({ 
        code: discountCode.toUpperCase() 
      });

      if (discount && discount.isValid()) {
        // Check if user is eligible for this discount
        const user = await User.findById(userId);
        const isFirstTimeAdopter = await AdoptionApplication.countDocuments({
          user: userId,
          status: 'completed'
        }) === 0;

        let isEligible = true;

        // Check user restrictions
        if (discount.userRestrictions.firstTimeAdopters && !isFirstTimeAdopter) {
          isEligible = false;
        }

        if (discount.userRestrictions.specificUsers.length > 0 &&
            !discount.userRestrictions.specificUsers.includes(userId)) {
          isEligible = false;
        }

        // Check pet type restrictions
        if (discount.applicablePetTypes.length > 0 &&
            !discount.applicablePetTypes.includes(pet.type)) {
          isEligible = false;
        }

        if (isEligible) {
          discountAmount = discount.calculateDiscount(originalAmount);
          finalAmount = originalAmount - discountAmount;
          appliedDiscountCode = discount.code;

          // Increment usage count
          discount.usedCount += 1;
          await discount.save();
        }
      }
    }

    // Create adoption application
    const application = new AdoptionApplication({
      user: userId,
      pet: petId,
      pickupOptions,
      applicationDetails,
      adoptionFee: {
        originalAmount,
        discountAmount,
        finalAmount,
        discountCode: appliedDiscountCode
      }
    });

    await application.save();

    // Populate user and pet details for response
    await application.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'pet', select: 'name type breed age images' }
    ]);

    res.status(201).json({
      message: 'Adoption application submitted successfully',
      application
    });

  } catch (error) {
    console.error('Create adoption application error:', error);
    res.status(500).json({ message: 'Error creating adoption application' });
  }
};

// Get user's adoption applications
const getUserApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const applications = await AdoptionApplication.find(query)
      .populate('pet', 'name type breed age images adoptionFee')
      .sort({ applicationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionApplication.countDocuments(query);

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get user applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const application = await AdoptionApplication.findById(id)
      .populate('user', 'name email phone')
      .populate('pet', 'name type breed age images adoptionFee description')
      .populate('reviewedBy', 'name');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized to view this application
    if (application.user._id.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(application);

  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ message: 'Error fetching application' });
  }
};

// Update application status (admin only)
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const application = await AdoptionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    application.adminNotes = adminNotes;
    application.reviewDate = new Date();
    application.reviewedBy = req.user.id;

    await application.save();

    await application.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'pet', select: 'name type breed age images' },
      { path: 'reviewedBy', select: 'name' }
    ]);

    res.json({
      message: 'Application status updated successfully',
      application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Error updating application status' });
  }
};

// Get all applications (admin only)
const getAllApplications = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const applications = await AdoptionApplication.find(query)
      .populate('user', 'name email phone')
      .populate('pet', 'name type breed age images')
      .populate('reviewedBy', 'name')
      .sort({ applicationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdoptionApplication.countDocuments(query);

    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
};

// Cancel application
const cancelApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const application = await AdoptionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.user.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Only pending applications can be cancelled' 
      });
    }

    application.status = 'cancelled';
    await application.save();

    res.json({ message: 'Application cancelled successfully' });

  } catch (error) {
    console.error('Cancel application error:', error);
    res.status(500).json({ message: 'Error cancelling application' });
  }
};

module.exports = {
  createAdoptionApplication,
  getUserApplications,
  getApplicationById,
  updateApplicationStatus,
  getAllApplications,
  cancelApplication
}; 