const Review = require('../models/Review');
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const { normalizeSkill } = require('../utils/normalize');

/**
 * Recomputes and updates ratingAverage and ratingCount for a user.
 * Only reviews with countsTowardRating === true are included in the average.
 */
async function updateUserRatings(userId) {
  const reviews = await Review.find({
    reviewee: userId,
    countsTowardRating: true,
  });

  const ratingCount = reviews.length;
  let ratingAverage = 0;
  if (ratingCount > 0) {
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    ratingAverage = Math.round((sum / ratingCount) * 10) / 10;
  }

  await User.findByIdAndUpdate(userId, {
    ratingAverage,
    ratingCount,
  });

  return { ratingAverage, ratingCount };
}

/**
 * POST /api/requests/:id/review
 * Body: { rating, comment }
 * Ignores any client-supplied reviewer/reviewee or countsTowardRating.
 */
const createReview = async (req, res, next) => {
  try {
    const user = req.user;
    const { rating, comment = '' } = req.body;

    // Validate rating: integer between 1 and 5
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    if (comment && comment.length > 300) {
      return res.status(400).json({ error: 'Comment cannot exceed 300 characters.' });
    }

    const session = await SessionRequest.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    // Rule: Must be completed
    if (session.status !== 'completed') {
      return res.status(409).json({
        error: `Cannot review session with status "${session.status}". Session must be completed.`,
      });
    }

    const isInitiator = session.initiatedBy.toString() === user._id.toString();
    const isReceiver = session.receiver.toString() === user._id.toString();

    // Rule: Non-participants cannot review
    if (!isInitiator && !isReceiver) {
      return res.status(403).json({ error: 'Only participants of this session can submit a review.' });
    }

    // Determine reviewee and skill derived strictly on the server:
    let revieweeId;
    let skill = '';
    let countsTowardRating = true;

    if (session.type === 'swap') {
      if (isInitiator) {
        revieweeId = session.receiver;
        skill = session.skillTeachByReceiver || session.skillTeachByInitiator || 'Skill Swap';
      } else {
        revieweeId = session.initiatedBy;
        skill = session.skillTeachByInitiator || session.skillTeachByReceiver || 'Skill Swap';
      }
      countsTowardRating = true;
    } else {
      // Paid session
      const isLearner = session.learner && session.learner.toString() === user._id.toString();
      const isTeacher = session.teacher && session.teacher.toString() === user._id.toString();

      if (isLearner) {
        revieweeId = session.teacher;
        skill = session.skill;
        countsTowardRating = true;
      } else if (isTeacher) {
        revieweeId = session.learner;
        skill = session.skill;
        // Only learner's review of the teacher counts toward public tutor rating
        countsTowardRating = false;
      } else {
        return res.status(403).json({ error: 'You are not recognized as learner or teacher for this paid session.' });
      }
    }

    // Check self-review
    if (revieweeId.toString() === user._id.toString()) {
      return res.status(400).json({ error: 'You cannot review yourself.' });
    }

    // Check duplicate review
    const existing = await Review.findOne({
      session: session._id,
      reviewer: user._id,
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this session.' });
    }

    const review = await Review.create({
      session: session._id,
      reviewer: user._id,
      reviewee: revieweeId,
      skill,
      rating: numRating,
      comment: comment.trim(),
      countsTowardRating,
    });

    // Update reviewee's aggregated ratings
    const updatedRatings = await updateUserRatings(revieweeId);

    const populated = await Review.findById(review._id)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email');

    res.status(201).json({
      message: 'Review submitted successfully.',
      review: populated,
      revieweeRatings: updatedRatings,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'You have already reviewed this session.' });
    }
    next(error);
  }
};

/**
 * GET /api/users/:id/reviews?skill=optional&page=1&limit=10
 * Returns paginated reviews for a user.
 */
const getUserReviews = async (req, res, next) => {
  try {
    const { id: userId } = req.params;
    const { skill, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = { reviewee: userId };
    if (skill && skill.trim()) {
      query.skill = new RegExp(`^${normalizeSkill(skill.trim())}$`, 'i');
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
    ]);

    res.json({
      reviews: reviews.map((r) => ({
        _id: r._id,
        reviewer: {
          _id: r.reviewer?._id,
          name: r.reviewer?.name || 'Anonymous Peer',
        },
        rating: r.rating,
        comment: r.comment,
        skill: r.skill,
        createdAt: r.createdAt,
      })),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviews,
  updateUserRatings,
};
