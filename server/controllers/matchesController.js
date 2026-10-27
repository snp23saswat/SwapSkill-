const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const { findMatches } = require('../utils/matching');

/**
 * GET /api/matches?category=all|mutual-swap|paid-tutor|potential-student
 * Returns scored match candidates for the authenticated user.
 */
const getMatches = async (req, res, next) => {
  try {
    const me = req.user;
    const { category = 'all' } = req.query;

    // Fetch all other users
    const allUsers = await User.find({ _id: { $ne: me._id } });

    // Fetch existing pending/accepted requests involving me to filter duplicates
    const existingRequests = await SessionRequest.find({
      $or: [{ initiatedBy: me._id }, { receiver: me._id }],
      status: { $in: ['pending', 'accepted'] },
    });

    let matches = findMatches(me, allUsers, existingRequests);

    // If specific category requested, filter matches that have this category
    if (category && category !== 'all') {
      matches = matches
        .map((m) => {
          const filteredCategories = m.categories.filter((c) => c.type === category);
          if (filteredCategories.length === 0) return null;
          return {
            ...m,
            categories: filteredCategories,
            topScore: Math.max(...filteredCategories.map((c) => c.score)),
          };
        })
        .filter(Boolean);

      matches.sort((a, b) => b.topScore - a.topScore);
    }

    res.json({
      count: matches.length,
      category,
      matches,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMatches };
