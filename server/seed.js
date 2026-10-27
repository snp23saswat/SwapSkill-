require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const SessionRequest = require('./models/SessionRequest');
const Review = require('./models/Review');

async function seed() {
  console.log('Connecting to MongoDB for seeding...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected! Wiping existing users, session requests, and reviews...');

  await User.deleteMany({});
  await SessionRequest.deleteMany({});
  await Review.deleteMany({});

  const defaultPassword = await bcrypt.hash('Demo@1234', 10);

  // 14 rich demo users designed to satisfy all matching categories:
  const usersData = [
    // 1. PRIMARY DEMO USER (sees ALL categories: mutual-swap, paid-tutor, potential-student, one-way-swap)
    {
      name: 'Alex Rivera (Demo)',
      email: 'demo@skillswap.com',
      password: defaultPassword,
      bio: 'Full-stack enthusiast & music lover. Passionate about teaching modern web tech and picking up new acoustic instruments!',
      availability: 'Weekdays after 6 PM IST, Weekends anytime',
      offered: [
        { skill: 'react', mode: 'both', hourlyRate: 400 },
        { skill: 'javascript', mode: 'both', hourlyRate: 350 },
        { skill: 'node.js', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['guitar', 'python', 'french'],
      sessionsCompleted: 4,
      earnings: { totalReleased: 800 },
    },

    // 2. MUTUAL SWAP PARTNER FOR DEMO (Teaches Guitar, wants React) - Mutual Pair 1
    {
      name: 'Rohan Sharma',
      email: 'rohan.guitar@skillswap.com',
      password: defaultPassword,
      bio: 'Acoustic & classical guitarist of 7 years. Looking to build a personal portfolio website with React!',
      availability: 'Saturday & Sunday mornings',
      offered: [
        { skill: 'guitar', mode: 'swap', hourlyRate: null },
        { skill: 'music theory', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['react', 'web design'],
      sessionsCompleted: 6,
      earnings: { totalReleased: 0 },
    },

    // 3. MUTUAL SWAP PAIR 2: Priya (UI/UX) <-> Kabir (Data Structures)
    {
      name: 'Priya Mehta',
      email: 'priya.design@skillswap.com',
      password: defaultPassword,
      bio: 'Product designer working with Figma & design systems. Preparing for tech interviews and need DSA practice.',
      availability: 'Mon, Wed, Fri 7-9 PM IST',
      offered: [
        { skill: 'figma', mode: 'swap', hourlyRate: null },
        { skill: 'ui/ux design', mode: 'both', hourlyRate: 500 },
      ],
      wanted: ['data structures', 'c++'],
      sessionsCompleted: 3,
      earnings: { totalReleased: 500 },
    },
    {
      name: 'Kabir Verma',
      email: 'kabir.dsa@skillswap.com',
      password: defaultPassword,
      bio: 'Competitive programmer (Candidate Master). Looking to improve my app designs using Figma.',
      availability: 'Weekends 2-6 PM',
      offered: [
        { skill: 'data structures', mode: 'swap', hourlyRate: null },
        { skill: 'c++', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['figma', 'ui/ux design'],
      sessionsCompleted: 8,
      earnings: { totalReleased: 0 },
    },

    // 5. MUTUAL SWAP PAIR 3: Ananya (Spanish) <-> Vikram (Photography)
    {
      name: 'Ananya Sen',
      email: 'ananya.languages@skillswap.com',
      password: defaultPassword,
      bio: 'Certified DELE B2 Spanish speaker. Love travel, culture, and capturing candid portrait photography.',
      availability: 'Tuesday & Thursday evenings',
      offered: [
        { skill: 'spanish', mode: 'swap', hourlyRate: null },
        { skill: 'english', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['photography', 'video editing'],
      sessionsCompleted: 5,
      earnings: { totalReleased: 0 },
    },
    {
      name: 'Vikram Joshi',
      email: 'vikram.photo@skillswap.com',
      password: defaultPassword,
      bio: 'Freelance photographer & drone operator. Planning a trip to South America and need Spanish basics.',
      availability: 'Flexible timing on weekdays',
      offered: [
        { skill: 'photography', mode: 'swap', hourlyRate: null },
        { skill: 'photoshop', mode: 'both', hourlyRate: 450 },
      ],
      wanted: ['spanish'],
      sessionsCompleted: 7,
      earnings: { totalReleased: 900 },
    },

    // 7. TUTOR-ONLY USER 1: Pure paid tutor (EMPTY wanted) - Python & ML Expert (Demo user sees as "paid-tutor")
    {
      name: 'Dr. Sameer Kulkarni',
      email: 'sameer.tutor@skillswap.com',
      password: defaultPassword,
      bio: 'PhD in AI/ML with 8+ years teaching Python, Machine Learning, and Math. College project mentorship available.',
      availability: 'Every day 8 PM - 10 PM IST',
      offered: [
        { skill: 'python', mode: 'paid', hourlyRate: 600 },
        { skill: 'machine learning', mode: 'paid', hourlyRate: 750 },
        { skill: 'mathematics', mode: 'paid', hourlyRate: 500 },
      ],
      wanted: [], // TUTOR-ONLY: EMPTY WANTED!
      sessionsCompleted: 15,
      earnings: { totalReleased: 9000 },
    },

    // 8. TUTOR-ONLY USER 2: Vocal Coach & Piano Tutor (EMPTY wanted)
    {
      name: 'Maya Rao',
      email: 'maya.music@skillswap.com',
      password: defaultPassword,
      bio: 'Trained Hindustani classical & western vocal coach. Private coaching with personalized warm-up routines.',
      availability: 'Mon - Thu 4 PM - 8 PM',
      offered: [
        { skill: 'singing', mode: 'paid', hourlyRate: 500 },
        { skill: 'piano', mode: 'paid', hourlyRate: 550 },
      ],
      wanted: [], // TUTOR-ONLY: EMPTY WANTED!
      sessionsCompleted: 12,
      earnings: { totalReleased: 6000 },
    },

    // 9. TUTOR-ONLY USER 3: Public Speaking & Communication Coach (EMPTY wanted)
    {
      name: 'Arjun Nambiar',
      email: 'arjun.coach@skillswap.com',
      password: defaultPassword,
      bio: 'TEDx speaker and corporate communication coach. Helping students ace campus placements & seminar presentations.',
      availability: 'Sunday 10 AM - 5 PM',
      offered: [
        { skill: 'public speaking', mode: 'paid', hourlyRate: 700 },
        { skill: 'communication skills', mode: 'paid', hourlyRate: 450 },
      ],
      wanted: [], // TUTOR-ONLY: EMPTY WANTED!
      sessionsCompleted: 19,
      earnings: { totalReleased: 11500 },
    },

    // 10. STUDENT FOR DEMO USER: Wants React & JavaScript (Demo user sees as "potential-student")
    {
      name: 'Karan Patel',
      email: 'karan.student@skillswap.com',
      password: defaultPassword,
      bio: 'Sophomore IT student trying to master React and frontend web development for an upcoming hackathon.',
      availability: 'Evenings 6-9 PM',
      offered: [{ skill: 'cooking', mode: 'swap', hourlyRate: null }],
      wanted: ['react', 'javascript'], // Wants what Demo teaches!
      sessionsCompleted: 1,
      earnings: { totalReleased: 0 },
    },

    // 11. ANOTHER STUDENT: Wants Node.js & Machine Learning
    {
      name: 'Neha Gupta',
      email: 'neha.learner@skillswap.com',
      password: defaultPassword,
      bio: 'Enthusiastic beginner in backend engineering. Looking for guided 1-on-1 tutoring sessions.',
      availability: 'Weekends full day',
      offered: [{ skill: 'content writing', mode: 'swap', hourlyRate: null }],
      wanted: ['node.js', 'machine learning'],
      sessionsCompleted: 2,
      earnings: { totalReleased: 0 },
    },

    // 12. ONE-WAY MATCH FOR DEMO: Teaches French (swap) but wants Tabla (Demo sees as "one-way-swap")
    {
      name: 'Chloe Dupont',
      email: 'chloe.french@skillswap.com',
      password: defaultPassword,
      bio: 'Native French tutor exchange student in Mumbai. Passionate about learning Indian classical percussion (Tabla)!',
      availability: 'Wednesdays and Saturdays',
      offered: [{ skill: 'french', mode: 'swap', hourlyRate: null }],
      wanted: ['tabla'], // Demo does not teach tabla
      sessionsCompleted: 4,
      earnings: { totalReleased: 0 },
    },

    // 13. "BOTH" USER: Fitness & Yoga trainer (Swap or Paid)
    {
      name: 'Aditya Roy',
      email: 'aditya.fitness@skillswap.com',
      password: defaultPassword,
      bio: 'Certified ACE fitness coach & Ashtanga yoga practitioner. Open to swapping for coding lessons or private coaching.',
      availability: 'Mornings 6 AM - 9 AM IST',
      offered: [
        { skill: 'fitness training', mode: 'both', hourlyRate: 350 },
        { skill: 'yoga', mode: 'both', hourlyRate: 300 },
      ],
      wanted: ['python', 'financial literacy'],
      sessionsCompleted: 9,
      earnings: { totalReleased: 3150 },
    },

    // 14. "BOTH" USER: Flutter & Mobile Dev Mentor
    {
      name: 'Sneha Kulkarni',
      email: 'sneha.flutter@skillswap.com',
      password: defaultPassword,
      bio: 'Mobile dev building cross-platform apps with Flutter & Dart. Happy to swap for German lessons or tutor students.',
      availability: 'Fridays & Saturdays 5 PM - 8 PM',
      offered: [
        { skill: 'flutter', mode: 'both', hourlyRate: 500 },
        { skill: 'git', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['german', 'animation'],
      sessionsCompleted: 6,
      earnings: { totalReleased: 2500 },
    },
  ];

  const createdUsers = await User.insertMany(usersData);
  console.log(`Successfully seeded ${createdUsers.length} users!`);

  // Create a few realistic requests for Demo user so requests dashboard & wallet have rich live data:
  const demoUser = createdUsers.find((u) => u.email === 'demo@skillswap.com');
  const rohan = createdUsers.find((u) => u.email === 'rohan.guitar@skillswap.com');
  const tutorSameer = createdUsers.find((u) => u.email === 'sameer.tutor@skillswap.com');
  const studentKaran = createdUsers.find((u) => u.email === 'karan.student@skillswap.com');

  const tomorrow = new Date(Date.now() + 86400000);
  const nextWeek = new Date(Date.now() + 3 * 86400000);

  // 1. Incoming swap request from Rohan to Demo (pending)
  await SessionRequest.create({
    type: 'swap',
    initiatedBy: rohan._id,
    receiver: demoUser._id,
    skillTeachByInitiator: 'guitar',
    skillTeachByReceiver: 'react',
    message: 'Hey Alex! Would love to swap 1-hr of acoustic chords for some React hooks guidance.',
    proposedSlots: [tomorrow, nextWeek],
    status: 'pending',
  });

  // 2. Outgoing paid request from Demo to Dr. Sameer (accepted + payment held in escrow!)
  const paidReq = await SessionRequest.create({
    type: 'paid',
    initiatedBy: demoUser._id,
    receiver: tutorSameer._id,
    teacher: tutorSameer._id,
    learner: demoUser._id,
    skill: 'python',
    durationMinutes: 60,
    ratePerHourSnapshot: 600,
    price: 600,
    paymentStatus: 'held',
    paymentRef: 'sim_pay_demo_escrow_9821',
    message: 'Hi Dr. Sameer, need help with Python OOP concepts and decorators.',
    proposedSlots: [tomorrow],
    status: 'accepted',
    scheduledAt: tomorrow,
    meetingLink: 'https://meet.google.com/skillswap-python-demo',
  });

  // 3. Paid request where Karan booked Demo to teach React (accepted + completed!)
  const completedSession1 = await SessionRequest.create({
    type: 'paid',
    initiatedBy: studentKaran._id,
    receiver: demoUser._id,
    teacher: demoUser._id,
    learner: studentKaran._id,
    skill: 'react',
    durationMinutes: 60,
    ratePerHourSnapshot: 400,
    price: 400,
    paymentStatus: 'released',
    paymentRef: 'sim_pay_demo_released_3819',
    message: 'Thanks for accepting to teach me React component lifecycle!',
    proposedSlots: [new Date(Date.now() - 86400000)],
    status: 'completed',
    scheduledAt: new Date(Date.now() - 86400000),
    meetingLink: 'https://meet.google.com/skillswap-react-completed',
  });

  // Karan reviews Alex (Demo) for React: 5 stars
  await Review.create({
    session: completedSession1._id,
    reviewer: studentKaran._id,
    reviewee: demoUser._id,
    skill: 'react',
    rating: 5,
    comment: 'Alex is an incredible React tutor! Broke down useEffect and custom hooks so effortlessly.',
    countsTowardRating: true,
  });

  // 4. Completed sessions & reviews for Dr. Sameer Kulkarni (PhD Tutor)
  const studentNeha = createdUsers.find((u) => u.email === 'neha.learner@skillswap.com');
  const studentVikram = createdUsers.find((u) => u.email === 'vikram.photo@skillswap.com');

  const sameerSession1 = await SessionRequest.create({
    type: 'paid',
    initiatedBy: studentNeha._id,
    receiver: tutorSameer._id,
    teacher: tutorSameer._id,
    learner: studentNeha._id,
    skill: 'python',
    durationMinutes: 60,
    ratePerHourSnapshot: 600,
    price: 600,
    paymentStatus: 'released',
    paymentRef: 'sim_pay_sameer_1',
    message: 'Python fundamentals and data structures.',
    proposedSlots: [new Date(Date.now() - 5 * 86400000)],
    status: 'completed',
    scheduledAt: new Date(Date.now() - 5 * 86400000),
    meetingLink: 'https://meet.google.com/sameer-python-1',
  });

  const sameerSession2 = await SessionRequest.create({
    type: 'paid',
    initiatedBy: studentVikram._id,
    receiver: tutorSameer._id,
    teacher: tutorSameer._id,
    learner: studentVikram._id,
    skill: 'machine learning',
    durationMinutes: 90,
    ratePerHourSnapshot: 750,
    price: 1125,
    paymentStatus: 'released',
    paymentRef: 'sim_pay_sameer_2',
    message: 'ML linear regression and cost function.',
    proposedSlots: [new Date(Date.now() - 3 * 86400000)],
    status: 'completed',
    scheduledAt: new Date(Date.now() - 3 * 86400000),
    meetingLink: 'https://meet.google.com/sameer-ml-2',
  });

  const sameerSession3 = await SessionRequest.create({
    type: 'paid',
    initiatedBy: studentKaran._id,
    receiver: tutorSameer._id,
    teacher: tutorSameer._id,
    learner: studentKaran._id,
    skill: 'python',
    durationMinutes: 60,
    ratePerHourSnapshot: 600,
    price: 600,
    paymentStatus: 'released',
    paymentRef: 'sim_pay_sameer_3',
    message: 'OOP concepts in Python.',
    proposedSlots: [new Date(Date.now() - 2 * 86400000)],
    status: 'completed',
    scheduledAt: new Date(Date.now() - 2 * 86400000),
    meetingLink: 'https://meet.google.com/sameer-python-3',
  });

  await Review.create({
    session: sameerSession1._id,
    reviewer: studentNeha._id,
    reviewee: tutorSameer._id,
    skill: 'python',
    rating: 5,
    comment: 'Dr. Sameer is patient and exceptionally knowledgeable in Python. Highly recommended!',
    countsTowardRating: true,
  });

  await Review.create({
    session: sameerSession2._id,
    reviewer: studentVikram._id,
    reviewee: tutorSameer._id,
    skill: 'machine learning',
    rating: 5,
    comment: 'The mathematical intuition behind gradient descent was made crystal clear.',
    countsTowardRating: true,
  });

  await Review.create({
    session: sameerSession3._id,
    reviewer: studentKaran._id,
    reviewee: tutorSameer._id,
    skill: 'python',
    rating: 4,
    comment: 'Very practical examples and solid exercises. Great tutoring session.',
    countsTowardRating: true,
  });

  // 5. Completed Swap Session between Priya (UI/UX) & Kabir (DSA)
  const priya = createdUsers.find((u) => u.email === 'priya.design@skillswap.com');
  const kabir = createdUsers.find((u) => u.email === 'kabir.dsa@skillswap.com');

  const swapCompleted = await SessionRequest.create({
    type: 'swap',
    initiatedBy: priya._id,
    receiver: kabir._id,
    skillTeachByInitiator: 'figma',
    skillTeachByReceiver: 'data structures',
    message: 'Let us swap Figma component auto-layout for Binary Search Tree explanations.',
    proposedSlots: [new Date(Date.now() - 4 * 86400000)],
    status: 'completed',
    scheduledAt: new Date(Date.now() - 4 * 86400000),
    meetingLink: 'https://meet.google.com/swap-priya-kabir',
  });

  // Both review each other!
  await Review.create({
    session: swapCompleted._id,
    reviewer: priya._id,
    reviewee: kabir._id,
    skill: 'data structures',
    rating: 5,
    comment: 'Kabir explained tree traversal algorithms with such clarity! Loved the peer exchange.',
    countsTowardRating: true,
  });

  await Review.create({
    session: swapCompleted._id,
    reviewer: kabir._id,
    reviewee: priya._id,
    skill: 'figma',
    rating: 5,
    comment: 'Priya showed me how to structure Figma variants and auto-layout. Super friendly and skilled!',
    countsTowardRating: true,
  });

  // Update aggregated ratings on users
  await User.findByIdAndUpdate(demoUser._id, { ratingAverage: 5.0, ratingCount: 1 });
  await User.findByIdAndUpdate(tutorSameer._id, { ratingAverage: 4.7, ratingCount: 3 });
  await User.findByIdAndUpdate(kabir._id, { ratingAverage: 5.0, ratingCount: 1 });
  await User.findByIdAndUpdate(priya._id, { ratingAverage: 5.0, ratingCount: 1 });

  console.log('Seeded demo session requests, escrow states, and reviews with ratings.');
  console.log('\n--- SEED COMPLETE ---');
  console.log('Demo Login Credentials:');
  console.log('  Email:    demo@skillswap.com');
  console.log('  Password: Demo@1234');
  console.log('---------------------\n');

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
