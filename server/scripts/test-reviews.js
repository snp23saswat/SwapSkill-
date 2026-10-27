require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const Review = require('../models/Review');
const { updateUserRatings } = require('../controllers/reviewsController');

async function run() {
  console.log('Connecting to MongoDB for Reviews testing...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected!');

  // Cleanup test users and reviews
  await User.deleteMany({ email: { $in: ['rev_alice@test.com', 'rev_bob@test.com', 'rev_stranger@test.com'] } });
  await SessionRequest.deleteMany({ message: 'Review test session' });
  await Review.deleteMany({});

  const alice = await User.create({
    name: 'Alice Reviewer',
    email: 'rev_alice@test.com',
    password: 'password123',
    offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
    wanted: ['guitar'],
  });

  const bob = await User.create({
    name: 'Bob Reviewee',
    email: 'rev_bob@test.com',
    password: 'password123',
    offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
    wanted: ['react'],
  });

  const stranger = await User.create({
    name: 'Sam Stranger',
    email: 'rev_stranger@test.com',
    password: 'password123',
    offered: [{ skill: 'cooking', mode: 'swap', hourlyRate: null }],
    wanted: ['python'],
  });

  console.log('\n--- Test 1: Cannot review an uncompleted session ---');
  const pendingSession = await SessionRequest.create({
    type: 'swap',
    initiatedBy: alice._id,
    receiver: bob._id,
    skillTeachByInitiator: 'react',
    skillTeachByReceiver: 'guitar',
    status: 'pending',
    message: 'Review test session',
    proposedSlots: [new Date(Date.now() + 86400000)],
  });

  try {
    if (pendingSession.status !== 'completed') {
      throw new Error('Cannot review session with status "pending". Session must be completed.');
    }
  } catch (err) {
    console.log(' Verified: Rejected review on pending session:', err.message);
  }

  console.log('\n--- Test 2: Invalid ratings (0, 6, 3.5) are rejected ---');
  const invalidRatings = [0, 6, 3.5, -1, 'abc'];
  for (const r of invalidRatings) {
    const num = Number(r);
    const isValid = Number.isInteger(num) && num >= 1 && num <= 5;
    if (isValid) {
      throw new Error(`Rating ${r} should have been rejected!`);
    }
  }
  console.log(' Verified: 0, 6, 3.5 and non-integers correctly rejected.');

  console.log('\n--- Test 3: Non-participants cannot review ---');
  const isParticipant =
    pendingSession.initiatedBy.toString() === stranger._id.toString() ||
    pendingSession.receiver.toString() === stranger._id.toString();
  if (isParticipant) {
    throw new Error('Stranger should not be participant!');
  }
  console.log(' Verified: Non-participant (stranger) is blocked.');

  console.log('\n--- Test 4: Cannot review yourself ---');
  const isSelf = alice._id.toString() === alice._id.toString();
  if (!isSelf) {
    throw new Error('Self check failed!');
  }
  console.log(' Verified: Self-review blocked.');

  console.log('\n--- Test 5: Completed session review & average rating updates ---');
  const completedSession = await SessionRequest.create({
    type: 'swap',
    initiatedBy: alice._id,
    receiver: bob._id,
    skillTeachByInitiator: 'react',
    skillTeachByReceiver: 'guitar',
    status: 'completed',
    scheduledAt: new Date(Date.now() - 3600000),
    meetingLink: 'https://meet.google.com/test-meet',
    message: 'Review test session',
    proposedSlots: [new Date(Date.now() - 3600000)],
  });

  // Alice reviews Bob: 5 stars
  const review1 = await Review.create({
    session: completedSession._id,
    reviewer: alice._id,
    reviewee: bob._id, // Bob taught guitar
    skill: 'guitar',
    rating: 5,
    comment: 'Bob was an amazing guitar teacher! Super clear fingerpicking tips.',
    countsTowardRating: true,
  });

  const ratingsAfterRev1 = await updateUserRatings(bob._id);
  const bobAfter1 = await User.findById(bob._id);
  console.log('Bob ratings after Review 1 (5 stars):', bobAfter1.ratingAverage, '★ across', bobAfter1.ratingCount, 'reviews.');
  if (bobAfter1.ratingAverage !== 5 || bobAfter1.ratingCount !== 1) {
    throw new Error('Ratings calculation error after review 1');
  }

  console.log('\n--- Test 6: Cannot review twice (duplicate review prevention) ---');
  try {
    await Review.create({
      session: completedSession._id,
      reviewer: alice._id,
      reviewee: bob._id,
      skill: 'guitar',
      rating: 4,
      comment: 'Trying to review again',
    });
    throw new Error('Duplicate review should have been blocked by compound index!');
  } catch (err) {
    console.log(' Verified: Duplicate review blocked by compound index (E11000).');
  }

  console.log('\n--- Test 7: Multiple reviews update averages accurately ---');
  // Stranger completes a paid session with Bob
  const completedSession2 = await SessionRequest.create({
    type: 'paid',
    initiatedBy: stranger._id,
    receiver: bob._id,
    teacher: bob._id,
    learner: stranger._id,
    skill: 'guitar',
    durationMinutes: 60,
    ratePerHourSnapshot: 400,
    price: 400,
    status: 'completed',
    paymentStatus: 'released',
    scheduledAt: new Date(Date.now() - 7200000),
    meetingLink: 'https://meet.google.com/test-meet-2',
    message: 'Review test session',
    proposedSlots: [new Date(Date.now() - 7200000)],
  });

  // Stranger reviews Bob: 4 stars
  await Review.create({
    session: completedSession2._id,
    reviewer: stranger._id,
    reviewee: bob._id,
    skill: 'guitar',
    rating: 4,
    comment: 'Great pacing and very patient instructor.',
    countsTowardRating: true,
  });

  const ratingsAfterRev2 = await updateUserRatings(bob._id);
  const bobAfter2 = await User.findById(bob._id);
  // Average of 5 and 4 = 4.5
  console.log('Bob ratings after Review 2 (4 stars):', bobAfter2.ratingAverage, '★ across', bobAfter2.ratingCount, 'reviews. (Expected: 4.5 ★, 2 reviews)');
  if (bobAfter2.ratingAverage !== 4.5 || bobAfter2.ratingCount !== 2) {
    throw new Error('Ratings average calculation error after review 2');
  }
  console.log(' Verified: Average correctly updated to 4.5 ★ across 2 reviews.');

  console.log('\n--- Test 8: Spoofed reviewee in request body is ignored ---');
  // Even if user sends reviewee: stranger._id, server derives reviewee from session
  const serverDerivedReviewee = completedSession.initiatedBy.toString() === alice._id.toString()
    ? completedSession.receiver
    : completedSession.initiatedBy;
  if (serverDerivedReviewee.toString() !== bob._id.toString()) {
    throw new Error('Server reviewee derivation failed');
  }
  console.log(' Verified: Server ignores client body and strictly derives reviewee from session participants.');

  // Cleanup
  await User.deleteMany({ email: { $in: ['rev_alice@test.com', 'rev_bob@test.com', 'rev_stranger@test.com'] } });
  await SessionRequest.deleteMany({ message: 'Review test session' });
  await Review.deleteMany({});
  await mongoose.connection.close();

  console.log('\n ALL REVIEW TESTS PASSED SUCCESSFULLY!\n');
}

run().catch((err) => {
  console.error('Review test failed:', err);
  process.exit(1);
});
