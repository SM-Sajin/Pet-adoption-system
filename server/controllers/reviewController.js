const Review = require('../models/Review');
const User = require('../models/User');

// Create a review for a user (e.g., pet owner or adopter)
const createReview = async (req, res) => {
  try {
    const { reviewedUserId, rating, comment, petId } = req.body;

    if (!reviewedUserId || !rating) {
      return res.status(400).json({ message: 'reviewedUserId and rating are required' });
    }

    const review = await Review.create({
      reviewer: req.user._id,
      reviewedUser: reviewedUserId,
      pet: petId || null,
      rating,
      comment: comment || ''
    });

    // Update reviewed user's aggregate rating
    const agg = await Review.aggregate([
      { $match: { reviewedUser: review.reviewedUser } },
      { $group: { _id: '$reviewedUser', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (agg && agg[0]) {
      await User.findByIdAndUpdate(review.reviewedUser, {
        averageRating: Math.round(agg[0].avg * 10) / 10,
        totalReviews: agg[0].count
      });
    }

    await review.populate([
      { path: 'reviewer', select: 'name profileImage' },
      { path: 'reviewedUser', select: 'name averageRating totalReviews' },
      { path: 'pet', select: 'name images' }
    ]);

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews for a user
const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ reviewedUser: userId })
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('reviewer', 'name profileImage')
      .populate('pet', 'name images');

    const total = await Review.countDocuments({ reviewedUser: userId });

    res.json({
      reviews,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createReview, getUserReviews };


