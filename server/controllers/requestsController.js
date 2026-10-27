const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const Review = require('../models/Review');
const { swapEligible, paidEligible } = require('../utils/matching');
const { normalizeSkill } = require('../utils/normalize');

/**
 * POST /api/requests
 * Body for SWAP:
 * {
 *   type: "swap",
 *   receiver: userId,
 *   skillTeachByInitiator: string, // optional for one-way
 *   skillTeachByReceiver: string,  // optional for one-way
 *   message: string,
 *   proposedSlots: [ISO dates] (1 to 3, future)
 * }
 *
 * Body for PAID:
 * {
 *   type: "paid",
 *   receiver: userId,
 *   role: "learner" | "teacher" (default: "learner" - user books teacher),
 *   skill: string,
 *   durationMinutes: 30 | 60 | 90,
 *   message: string,
 *   proposedSlots: [ISO dates] (1 to 3, future)
 * }
 */
const createRequest = async (req, res, next) => {
  try {
    const initiator = req.user;
    const {
      type,
      receiver: receiverId,
      skillTeachByInitiator,
      skillTeachByReceiver,
      role = 'learner', // when initiator is booking a tutor vs offering to teach a student
      skill,
      durationMinutes,
      message = '',
      proposedSlots,
    } = req.body;

    if (!type || !['swap', 'paid'].includes(type)) {
      return res.status(400).json({ error: 'Request type must be "swap" or "paid".' });
    }

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver is required.' });
    }

    if (initiator._id.toString() === receiverId.toString()) {
      return res.status(400).json({ error: 'Cannot send a session request to yourself.' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver user not found.' });
    }

    // Validate proposedSlots (1 to 3, all future)
    if (!Array.isArray(proposedSlots) || proposedSlots.length < 1 || proposedSlots.length > 3) {
      return res.status(400).json({ error: 'Provide between 1 and 3 proposed time slots.' });
    }

    const now = new Date();
    const parsedSlots = [];
    for (const slot of proposedSlots) {
      const d = new Date(slot);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ error: `Invalid date format in proposed slots: ${slot}` });
      }
      if (d <= now) {
        return res.status(400).json({ error: 'All proposed slots must be in the future.' });
      }
      parsedSlots.push(d);
    }

    if (message && message.length > 300) {
      return res.status(400).json({ error: 'Message cannot exceed 300 characters.' });
    }

    let requestData = {
      type,
      initiatedBy: initiator._id,
      receiver: receiver._id,
      message: message.trim(),
      proposedSlots: parsedSlots,
      status: 'pending',
    };

    if (type === 'swap') {
      const normInitiatorSkill = normalizeSkill(skillTeachByInitiator);
      const normReceiverSkill = normalizeSkill(skillTeachByReceiver);

      if (!normInitiatorSkill && !normReceiverSkill) {
        return res.status(400).json({ error: 'At least one skill must be provided for a swap request.' });
      }

      // Check initiator eligibility if offering
      if (normInitiatorSkill) {
        const hasSkill = initiator.offered.find(
          (o) => normalizeSkill(o.skill) === normInitiatorSkill && swapEligible(o)
        );
        if (!hasSkill) {
          return res.status(400).json({
            error: `You do not have "${normInitiatorSkill}" listed as a swap-eligible teaching skill.`,
          });
        }
      }

      // Check receiver eligibility if requesting
      if (normReceiverSkill) {
        const hasSkill = receiver.offered.find(
          (o) => normalizeSkill(o.skill) === normReceiverSkill && swapEligible(o)
        );
        if (!hasSkill) {
          return res.status(400).json({
            error: `${receiver.name} does not have "${normReceiverSkill}" listed as a swap-eligible teaching skill.`,
          });
        }
      }

      // Check duplicate pending request
      const existing = await SessionRequest.findOne({
        $or: [
          { initiatedBy: initiator._id, receiver: receiver._id },
          { initiatedBy: receiver._id, receiver: initiator._id },
        ],
        type: 'swap',
        status: { $in: ['pending', 'accepted'] },
        skillTeachByInitiator: normInitiatorSkill,
        skillTeachByReceiver: normReceiverSkill,
      });

      if (existing) {
        return res.status(409).json({ error: 'A pending or accepted swap request for these skills already exists with this user.' });
      }

      requestData.skillTeachByInitiator = normInitiatorSkill;
      requestData.skillTeachByReceiver = normReceiverSkill;
    } else {
      // PAID REQUEST
      const normSkill = normalizeSkill(skill);
      if (!normSkill) {
        return res.status(400).json({ error: 'Skill is required for paid sessions.' });
      }

      const validDurations = [30, 60, 90];
      const dur = Number(durationMinutes);
      if (!validDurations.includes(dur)) {
        return res.status(400).json({ error: 'Duration must be 30, 60, or 90 minutes.' });
      }

      let teacherUser, learnerUser;
      if (role === 'teacher') {
        // Initiator offers to teach receiver (potential-student)
        teacherUser = initiator;
        learnerUser = receiver;
      } else {
        // Initiator books tutor (receiver is tutor)
        teacherUser = receiver;
        learnerUser = initiator;
      }

      // Teacher must offer skill in paid or both mode
      const teacherOffered = teacherUser.offered.find(
        (o) => normalizeSkill(o.skill) === normSkill && paidEligible(o)
      );

      if (!teacherOffered) {
        return res.status(400).json({
          error: `${teacherUser.name} does not offer "${normSkill}" as a paid tutoring skill.`,
        });
      }

      // Server-side pricing enforcement: rate * duration / 60, rounded
      const ratePerHourSnapshot = teacherOffered.hourlyRate;
      const price = Math.round((ratePerHourSnapshot * dur) / 60);

      // Check duplicate pending/accepted request
      const existing = await SessionRequest.findOne({
        teacher: teacherUser._id,
        learner: learnerUser._id,
        type: 'paid',
        skill: normSkill,
        status: { $in: ['pending', 'accepted'] },
      });

      if (existing) {
        return res.status(409).json({ error: 'A pending or accepted paid request for this skill already exists between you two.' });
      }

      requestData.teacher = teacherUser._id;
      requestData.learner = learnerUser._id;
      requestData.skill = normSkill;
      requestData.durationMinutes = dur;
      requestData.ratePerHourSnapshot = ratePerHourSnapshot;
      requestData.price = price;
      requestData.paymentStatus = 'unpaid';
    }

    const sessionRequest = await SessionRequest.create(requestData);
    const populated = await SessionRequest.findById(sessionRequest._id)
      .populate('initiatedBy', 'name email bio')
      .populate('receiver', 'name email bio')
      .populate('teacher', 'name email bio')
      .populate('learner', 'name email bio');

    res.status(201).json({ request: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/requests?box=incoming|outgoing
 */
const getRequests = async (req, res, next) => {
  try {
    const user = req.user;
    const { box = 'incoming' } = req.query;

    let query = {};
    if (box === 'incoming') {
      query.receiver = user._id;
    } else {
      query.initiatedBy = user._id;
    }

    const requests = await SessionRequest.find(query)
      .populate('initiatedBy', 'name email bio availability')
      .populate('receiver', 'name email bio availability')
      .populate('teacher', 'name email bio')
      .populate('learner', 'name email bio')
      .sort({ createdAt: -1 });

    const sessionIds = requests.map((r) => r._id);
    const myReviews = await Review.find({
      session: { $in: sessionIds },
      reviewer: user._id,
    }).select('session');

    const reviewedSessionSet = new Set(myReviews.map((rev) => rev.session.toString()));

    const enrichedRequests = requests.map((r) => {
      const obj = r.toObject();
      obj.reviewedByMe = reviewedSessionSet.has(r._id.toString());
      return obj;
    });

    res.json({ box, count: enrichedRequests.length, requests: enrichedRequests });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/accept
 * Body: { slot: Date, meetingLink: string }
 * Only the receiver can accept.
 */
const acceptRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const { slot, meetingLink } = req.body;

    const request = await SessionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    if (request.receiver.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the recipient of the request can accept it.' });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({ error: `Cannot accept request with status "${request.status}".` });
    }

    if (!slot) {
      return res.status(400).json({ error: 'You must select one of the proposed slots.' });
    }

    const chosenSlot = new Date(slot);
    // Verify slot matches one of proposedSlots
    const slotMatches = request.proposedSlots.some(
      (s) => Math.abs(new Date(s).getTime() - chosenSlot.getTime()) < 1000
    );
    if (!slotMatches) {
      return res.status(400).json({ error: 'Selected slot must be one of the proposed slots.' });
    }

    if (!meetingLink || !meetingLink.trim()) {
      return res.status(400).json({ error: 'Meeting link is required to accept.' });
    }

    request.status = 'accepted';
    request.scheduledAt = chosenSlot;
    request.meetingLink = meetingLink.trim();

    await request.save();

    const populated = await SessionRequest.findById(request._id)
      .populate('initiatedBy', 'name email')
      .populate('receiver', 'name email')
      .populate('teacher', 'name email')
      .populate('learner', 'name email');

    res.json({ message: 'Request accepted successfully.', request: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/reject
 * Only receiver can reject.
 */
const rejectRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const request = await SessionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    if (request.receiver.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the recipient of the request can reject it.' });
    }

    if (request.status !== 'pending') {
      return res.status(409).json({ error: `Cannot reject request with status "${request.status}".` });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected.', request });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/cancel
 * - While pending: initiator can cancel.
 * - For paid+held: learner can also cancel before scheduledAt (triggers refund).
 */
const cancelRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const request = await SessionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    const isInitiator = request.initiatedBy.toString() === user._id.toString();
    const isLearner = request.learner && request.learner.toString() === user._id.toString();

    // Check conditions
    if (request.status === 'pending') {
      if (!isInitiator) {
        return res.status(403).json({ error: 'Only the initiator can cancel a pending request.' });
      }
      request.status = 'cancelled';
      await request.save();
      return res.json({ message: 'Request cancelled.', request });
    }

    if (request.status === 'accepted' && request.type === 'paid') {
      if (!isLearner && !isInitiator) {
        return res.status(403).json({ error: 'Only the learner/initiator can cancel an accepted paid request.' });
      }

      if (request.scheduledAt && new Date() >= new Date(request.scheduledAt)) {
        return res.status(409).json({ error: 'Cannot cancel session once scheduled time has arrived or passed.' });
      }

      request.status = 'cancelled';
      if (request.paymentStatus === 'held') {
        request.paymentStatus = 'refunded';
      }
      await request.save();
      return res.json({ message: 'Session cancelled and payment refunded.', request });
    }

    return res.status(409).json({ error: `Cannot cancel request with status "${request.status}".` });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/requests/:id/complete
 * Either participant can mark completed if:
 * 1. Status is accepted
 * 2. scheduledAt has arrived or passed (or for testing/demo flex: scheduledAt exists)
 * 3. If paid, requires paymentStatus === 'held'
 * On completion of paid session:
 * - paymentStatus: 'released'
 * - teacher.earnings.totalReleased += price
 * - both users sessionsCompleted++
 */
const completeRequest = async (req, res, next) => {
  try {
    const user = req.user;
    const request = await SessionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    const isParticipant =
      request.initiatedBy.toString() === user._id.toString() ||
      request.receiver.toString() === user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({ error: 'Only session participants can complete this session.' });
    }

    if (request.status !== 'accepted') {
      return res.status(409).json({ error: `Cannot complete session with status "${request.status}". Must be accepted.` });
    }

    // scheduledAt check
    if (!request.scheduledAt) {
      return res.status(400).json({ error: 'Session has no scheduled time.' });
    }

    // For paid sessions, check payment status must be held
    if (request.type === 'paid') {
      if (request.paymentStatus !== 'held') {
        return res.status(409).json({
          error: `Paid session cannot be completed until payment is held (current status: ${request.paymentStatus}).`,
        });
      }
    }

    request.status = 'completed';

    if (request.type === 'paid') {
      request.paymentStatus = 'released';
      await User.findByIdAndUpdate(request.teacher, {
        $inc: {
          'earnings.totalReleased': request.price,
          sessionsCompleted: 1,
        },
      });
      await User.findByIdAndUpdate(request.learner, {
        $inc: { sessionsCompleted: 1 },
      });
    } else {
      // Swap: both users increment sessionsCompleted
      await User.findByIdAndUpdate(request.initiatedBy, {
        $inc: { sessionsCompleted: 1 },
      });
      await User.findByIdAndUpdate(request.receiver, {
        $inc: { sessionsCompleted: 1 },
      });
    }

    await request.save();

    const populated = await SessionRequest.findById(request._id)
      .populate('initiatedBy', 'name email')
      .populate('receiver', 'name email')
      .populate('teacher', 'name email')
      .populate('learner', 'name email');

    res.json({ message: 'Session marked as completed successfully.', request: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/requests/:id/pay
 * Simulated payment gateway:
 * - Learner only
 * - Status must be accepted
 * - paymentStatus must be unpaid
 * - Sets paymentStatus to 'held' and generates simulated paymentRef
 */
const paySession = async (req, res, next) => {
  try {
    const user = req.user;
    const request = await SessionRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: 'Session request not found.' });
    }

    if (request.type !== 'paid') {
      return res.status(400).json({ error: 'Payment is only applicable to paid sessions.' });
    }

    if (request.status !== 'accepted') {
      return res.status(409).json({ error: 'Session must be accepted before payment.' });
    }

    if (request.learner.toString() !== user._id.toString()) {
      return res.status(403).json({ error: 'Only the learner can pay for this session.' });
    }

    if (request.paymentStatus !== 'unpaid') {
      return res.status(409).json({ error: `Payment already processed (status: ${request.paymentStatus}).` });
    }

    // Simulated payment processing (interface compatible with future Razorpay swap)
    const fakePaymentRef = `sim_pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    request.paymentStatus = 'held';
    request.paymentRef = fakePaymentRef;
    await request.save();

    const populated = await SessionRequest.findById(request._id)
      .populate('teacher', 'name email')
      .populate('learner', 'name email');

    res.json({
      message: 'Payment of ₹' + request.price + ' held in escrow successfully (simulated demo mode).',
      paymentRef: fakePaymentRef,
      request: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
  paySession,
};
