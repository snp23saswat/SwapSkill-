require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');

async function run() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  // Cleanup test users
  await User.deleteMany({ email: { $in: ['alice_flow@test.com', 'bob_flow@test.com', 'tutor_flow@test.com', 'student_flow@test.com'] } });
  await SessionRequest.deleteMany({});

  console.log('\n--- 1. Testing SWAP Flow ---');
  const alice = await User.create({
    name: 'Alice Swapper',
    email: 'alice_flow@test.com',
    password: 'password123',
    offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
    wanted: ['guitar'],
  });

  const bob = await User.create({
    name: 'Bob Swapper',
    email: 'bob_flow@test.com',
    password: 'password123',
    offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
    wanted: ['react'],
  });

  const swapReq = await SessionRequest.create({
    type: 'swap',
    initiatedBy: alice._id,
    receiver: bob._id,
    skillTeachByInitiator: 'react',
    skillTeachByReceiver: 'guitar',
    proposedSlots: [new Date(Date.now() + 86400000)],
    message: 'Let us swap React for Guitar',
  });
  console.log('Swap request created:', swapReq._id, 'status:', swapReq.status);

  // Bob accepts
  swapReq.status = 'accepted';
  swapReq.scheduledAt = swapReq.proposedSlots[0];
  swapReq.meetingLink = 'https://meet.google.com/test-swap';
  await swapReq.save();
  console.log('Swap accepted, meetingLink set.');

  // Complete session
  swapReq.status = 'completed';
  await swapReq.save();
  await User.findByIdAndUpdate(alice._id, { $inc: { sessionsCompleted: 1 } });
  await User.findByIdAndUpdate(bob._id, { $inc: { sessionsCompleted: 1 } });

  const aliceUpdated = await User.findById(alice._id);
  const bobUpdated = await User.findById(bob._id);
  console.log('Alice sessionsCompleted:', aliceUpdated.sessionsCompleted, '(expected 1)');
  console.log('Bob sessionsCompleted:', bobUpdated.sessionsCompleted, '(expected 1)');
  if (aliceUpdated.sessionsCompleted !== 1 || bobUpdated.sessionsCompleted !== 1) {
    throw new Error('Swap flow session increment failed');
  }
  console.log(' SWAP FLOW PASSED!');

  console.log('\n--- 2. Testing PAID Flow ---');
  // Tutor with empty wanted!
  const tutor = await User.create({
    name: 'Dr. Python',
    email: 'tutor_flow@test.com',
    password: 'password123',
    offered: [{ skill: 'python', mode: 'paid', hourlyRate: 600 }],
    wanted: [], // empty wanted!
  });

  const student = await User.create({
    name: 'Dave Student',
    email: 'student_flow@test.com',
    password: 'password123',
    offered: [{ skill: 'cooking', mode: 'swap', hourlyRate: null }],
    wanted: ['python'],
  });

  // Calculate price server-side: 600 * 60 / 60 = 600
  const durationMinutes = 60;
  const ratePerHour = tutor.offered[0].hourlyRate;
  const price = Math.round((ratePerHour * durationMinutes) / 60);

  const paidReq = await SessionRequest.create({
    type: 'paid',
    initiatedBy: student._id,
    receiver: tutor._id,
    teacher: tutor._id,
    learner: student._id,
    skill: 'python',
    durationMinutes,
    ratePerHourSnapshot: ratePerHour,
    price,
    paymentStatus: 'unpaid',
    proposedSlots: [new Date(Date.now() + 86400000)],
  });
  console.log('Paid session created. Price: ₹', paidReq.price, 'paymentStatus:', paidReq.paymentStatus);

  // Tutor accepts
  paidReq.status = 'accepted';
  paidReq.scheduledAt = paidReq.proposedSlots[0];
  paidReq.meetingLink = 'https://meet.google.com/python-class';
  await paidReq.save();
  console.log('Paid session accepted by tutor.');

  // Student pays: sets held
  paidReq.paymentStatus = 'held';
  paidReq.paymentRef = 'sim_pay_test_abc123';
  await paidReq.save();
  console.log('Student paid. paymentStatus:', paidReq.paymentStatus, 'paymentRef:', paidReq.paymentRef);

  // Complete session: marks released, updates earnings
  paidReq.status = 'completed';
  paidReq.paymentStatus = 'released';
  await paidReq.save();

  await User.findByIdAndUpdate(tutor._id, {
    $inc: { 'earnings.totalReleased': paidReq.price, sessionsCompleted: 1 },
  });
  await User.findByIdAndUpdate(student._id, {
    $inc: { sessionsCompleted: 1 },
  });

  const tutorUpdated = await User.findById(tutor._id);
  const studentUpdated = await User.findById(student._id);
  console.log('Tutor earnings.totalReleased: ₹', tutorUpdated.earnings.totalReleased, '(expected 600)');
  console.log('Tutor sessionsCompleted:', tutorUpdated.sessionsCompleted, '(expected 1)');
  console.log('Student sessionsCompleted:', studentUpdated.sessionsCompleted, '(expected 1)');

  if (tutorUpdated.earnings.totalReleased !== 600 || tutorUpdated.sessionsCompleted !== 1) {
    throw new Error('Paid flow completion failed');
  }
  console.log(' PAID FLOW PASSED!');

  // Clean up
  await User.deleteMany({ email: { $in: ['alice_flow@test.com', 'bob_flow@test.com', 'tutor_flow@test.com', 'student_flow@test.com'] } });
  await SessionRequest.deleteMany({});
  await mongoose.connection.close();
  console.log('\n ALL TESTS PASSED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Flow test error:', err);
  process.exit(1);
});
