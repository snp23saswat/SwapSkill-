const User = require('../models/User');
const { normalizeOffered, normalizeSkillArray } = require('../utils/normalize');

/**
 * PUT /api/users/me
 * Update the current user's profile: name, bio, offered[], wanted[], availability
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = req.user;
    const { name, bio, offered, wanted, availability } = req.body;

    if (name !== undefined) {
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name is required.' });
      }
      user.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 300) {
        return res.status(400).json({ error: 'Bio cannot exceed 300 characters.' });
      }
      user.bio = bio;
    }

    if (availability !== undefined) {
      user.availability = availability;
    }

    if (offered !== undefined) {
      const normalized = normalizeOffered(offered);
      // Validate rates for paid/both
      for (const entry of normalized) {
        if ((entry.mode === 'paid' || entry.mode === 'both') && 
            (entry.hourlyRate < 50 || entry.hourlyRate > 5000)) {
          return res.status(400).json({
            error: `Hourly rate for "${entry.skill}" must be ₹50–₹5000.`,
          });
        }
      }
      user.offered = normalized;
    }

    if (wanted !== undefined) {
      user.wanted = normalizeSkillArray(wanted);
    }

    // Validate gate: at least 1 taught skill, and (at least 1 wanted OR at least 1 paid/both)
    if (user.offered.length === 0) {
      return res.status(400).json({ error: 'You must teach at least one skill.' });
    }
    const hasPaidSkill = user.offered.some(
      (s) => s.mode === 'paid' || s.mode === 'both'
    );
    if (user.wanted.length === 0 && !hasPaidSkill) {
      return res.status(400).json({
        error: 'Add at least one skill you want to learn, or set at least one teaching skill to Paid/Both mode.',
      });
    }

    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 * Public profile: shows name, bio, availability, offered, sessionsCompleted
 */
const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        bio: user.bio,
        availability: user.availability,
        offered: user.offered,
        wanted: user.wanted,
        sessionsCompleted: user.sessionsCompleted,
        ratingAverage: user.ratingAverage || 0,
        ratingCount: user.ratingCount || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, getPublicProfile };
