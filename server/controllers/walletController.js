const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');

/**
 * GET /api/wallet
 * Returns:
 * {
 *   earned: number,       // totalReleased from user.earnings.totalReleased
 *   pendingHeld: number,  // sum of prices for sessions where user is teacher and paymentStatus === 'held'
 *   spent: number,        // sum of prices where user is learner and paymentStatus in ['held', 'released']
 *   history: array        // session requests where user was teacher or learner with payment activity
 * }
 */
const getWallet = async (req, res, next) => {
  try {
    const user = req.user;

    // Fetch all paid sessions involving this user
    const paidSessions = await SessionRequest.find({
      type: 'paid',
      $or: [{ teacher: user._id }, { learner: user._id }],
      paymentStatus: { $ne: 'unpaid' },
    })
      .populate('teacher', 'name email')
      .populate('learner', 'name email')
      .sort({ updatedAt: -1 });

    let pendingHeld = 0;
    let spent = 0;
    const history = [];

    for (const session of paidSessions) {
      const isTeacher = session.teacher && session.teacher._id.toString() === user._id.toString();
      const isLearner = session.learner && session.learner._id.toString() === user._id.toString();

      if (isTeacher && session.paymentStatus === 'held') {
        pendingHeld += session.price || 0;
      }

      if (isLearner && (session.paymentStatus === 'held' || session.paymentStatus === 'released')) {
        spent += session.price || 0;
      }

      history.push({
        _id: session._id,
        skill: session.skill,
        price: session.price,
        durationMinutes: session.durationMinutes,
        role: isTeacher ? 'teacher' : 'learner',
        counterpart: isTeacher ? session.learner?.name : session.teacher?.name,
        paymentStatus: session.paymentStatus,
        paymentRef: session.paymentRef,
        sessionStatus: session.status,
        scheduledAt: session.scheduledAt,
        date: session.updatedAt,
      });
    }

    res.json({
      earned: user.earnings?.totalReleased || 0,
      pendingHeld,
      spent,
      history,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWallet };
