const {
  swapEligible,
  paidEligible,
  computeMatch,
  findMatches,
} = require('../utils/matching');
const { normalizeSkill } = require('../utils/normalize');

// Helper to create a mock user object
function mockUser(overrides) {
  return {
    _id: overrides._id || 'user1',
    name: overrides.name || 'Test User',
    bio: overrides.bio || '',
    availability: overrides.availability || '',
    sessionsCompleted: overrides.sessionsCompleted || 0,
    offered: overrides.offered || [],
    wanted: overrides.wanted || [],
    ...overrides,
  };
}

describe('Matching Engine', () => {
  // ----------------------------------------------------------------
  // Test 1: Mutual swap - both sides teach what the other wants
  // ----------------------------------------------------------------
  test('1. mutual swap detected when both sides teach what the other wants', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();
    const mutualCat = match.categories.find((c) => c.type === 'mutual-swap');
    expect(mutualCat).toBeDefined();
    expect(mutualCat.theyTeachMe.length).toBe(1);
    expect(mutualCat.theyTeachMe[0].skill).toBe('guitar');
    expect(mutualCat.iTeachThem.length).toBe(1);
    expect(mutualCat.iTeachThem[0].skill).toBe('react');
  });

  // ----------------------------------------------------------------
  // Test 2: Paid-only tutor appears as paid-tutor, NOT as swap
  // ----------------------------------------------------------------
  test('2. paid-only tutor appears as paid-tutor, not swap', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'tutor',
      offered: [{ skill: 'guitar', mode: 'paid', hourlyRate: 500 }],
      wanted: [],
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();

    // Should have paid-tutor category
    const paidCat = match.categories.find((c) => c.type === 'paid-tutor');
    expect(paidCat).toBeDefined();
    expect(paidCat.skills[0].skill).toBe('guitar');
    expect(paidCat.skills[0].rate).toBe(500);

    // Should NOT have swap categories
    const swapCat = match.categories.find(
      (c) => c.type === 'mutual-swap' || c.type === 'one-way-swap'
    );
    expect(swapCat).toBeUndefined();
  });

  // ----------------------------------------------------------------
  // Test 3: Mode "both" works in swap and paid lists
  // ----------------------------------------------------------------
  test('3. mode "both" appears in both swap and paid categories', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'both', hourlyRate: 300 }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'guitar', mode: 'both', hourlyRate: 400 }],
      wanted: ['react'],
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();

    // Should have mutual-swap (both are swap-eligible)
    const mutualCat = match.categories.find((c) => c.type === 'mutual-swap');
    expect(mutualCat).toBeDefined();

    // Should have paid-tutor (other's guitar is paid-eligible)
    const paidCat = match.categories.find((c) => c.type === 'paid-tutor');
    expect(paidCat).toBeDefined();
    expect(paidCat.skills[0].rate).toBe(400);

    // Should have potential-student (my react is paid-eligible, they want it)
    const studentCat = match.categories.find((c) => c.type === 'potential-student');
    expect(studentCat).toBeDefined();
    expect(studentCat.skills[0].rate).toBe(300);
  });

  // ----------------------------------------------------------------
  // Test 4: User with EMPTY wanted still appears as potential-student for others
  // ----------------------------------------------------------------
  test('4. user with empty wanted appears as potential-student for someone teaching paid', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'paid', hourlyRate: 500 }],
      wanted: [],
    });
    const other = mockUser({
      _id: 'student',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();

    const studentCat = match.categories.find((c) => c.type === 'potential-student');
    expect(studentCat).toBeDefined();
    expect(studentCat.skills[0].skill).toBe('react');
    expect(studentCat.skills[0].rate).toBe(500);
  });

  // ----------------------------------------------------------------
  // Test 5: Alias normalization works in matching
  // ----------------------------------------------------------------
  test('5. alias normalization: "js" matches "javascript"', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'python', mode: 'swap', hourlyRate: null }],
      wanted: ['js'], // alias for javascript
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'javascript', mode: 'swap', hourlyRate: null }],
      wanted: ['python'],
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();
    const mutualCat = match.categories.find((c) => c.type === 'mutual-swap');
    expect(mutualCat).toBeDefined();
    expect(mutualCat.theyTeachMe[0].skill).toBe('javascript');
  });

  // ----------------------------------------------------------------
  // Test 6: Self excluded
  // ----------------------------------------------------------------
  test('6. self is excluded from matches', () => {
    const me = mockUser({
      _id: 'same-id',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'same-id',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });

    const match = computeMatch(me, other);
    expect(match).toBeNull();
  });

  // ----------------------------------------------------------------
  // Test 7: Ranking order (mutual > paid > potential > one-way)
  // ----------------------------------------------------------------
  test('7. ranking order: mutual-swap > paid-tutor > one-way', () => {
    const me = mockUser({
      _id: 'me',
      offered: [
        { skill: 'react', mode: 'swap', hourlyRate: null },
        { skill: 'python', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['guitar', 'piano', 'cooking'],
    });

    // Perfect mutual swap (both sides)
    const mutualUser = mockUser({
      _id: 'mutual',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });

    // Paid tutor only
    const paidUser = mockUser({
      _id: 'paid',
      offered: [{ skill: 'piano', mode: 'paid', hourlyRate: 600 }],
      wanted: [],
    });

    // One-way: they teach me but don't want anything I have
    const oneWayUser = mockUser({
      _id: 'oneway',
      offered: [{ skill: 'cooking', mode: 'swap', hourlyRate: null }],
      wanted: ['figma'], // I don't teach figma
    });

    const matches = findMatches(me, [oneWayUser, paidUser, mutualUser]);

    expect(matches.length).toBe(3);
    expect(matches[0].user._id).toBe('mutual'); // highest score
    expect(matches[1].user._id).toBe('paid');
    expect(matches[2].user._id).toBe('oneway'); // lowest score
  });

  // ----------------------------------------------------------------
  // Test 8: No overlap returns null
  // ----------------------------------------------------------------
  test('8. no overlap returns null match', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'python', mode: 'swap', hourlyRate: null }],
      wanted: ['cooking'],
    });

    const match = computeMatch(me, other);
    expect(match).toBeNull();
  });

  // ----------------------------------------------------------------
  // Test 9: Duplicate-request exclusion
  // ----------------------------------------------------------------
  test('9. duplicate pending request is excluded from matches', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });

    // Existing pending swap request for the same skill pair
    const existingRequests = [
      {
        type: 'swap',
        initiatedBy: 'me',
        receiver: 'other',
        skillTeachByInitiator: 'react',
        skillTeachByReceiver: 'guitar',
        status: 'pending',
      },
    ];

    const matches = findMatches(me, [other], existingRequests);
    expect(matches.length).toBe(0);
  });

  // ----------------------------------------------------------------
  // Test 10: One-way swap detected correctly
  // ----------------------------------------------------------------
  test('10. one-way swap: only one direction has overlap', () => {
    const me = mockUser({
      _id: 'me',
      offered: [{ skill: 'react', mode: 'swap', hourlyRate: null }],
      wanted: ['guitar'],
    });
    const other = mockUser({
      _id: 'other',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['python'], // doesn't want react
    });

    const match = computeMatch(me, other);
    expect(match).not.toBeNull();

    const oneWayCat = match.categories.find((c) => c.type === 'one-way-swap');
    expect(oneWayCat).toBeDefined();
    expect(oneWayCat.theyTeachMe.length).toBe(1);
    expect(oneWayCat.iTeachThem.length).toBe(0);

    // Should NOT have mutual-swap
    const mutualCat = match.categories.find((c) => c.type === 'mutual-swap');
    expect(mutualCat).toBeUndefined();
  });

  // ----------------------------------------------------------------
  // Test 11: swapEligible and paidEligible helpers
  // ----------------------------------------------------------------
  test('11. swapEligible and paidEligible helper functions', () => {
    expect(swapEligible({ mode: 'swap' })).toBe(true);
    expect(swapEligible({ mode: 'both' })).toBe(true);
    expect(swapEligible({ mode: 'paid' })).toBe(false);

    expect(paidEligible({ mode: 'paid' })).toBe(true);
    expect(paidEligible({ mode: 'both' })).toBe(true);
    expect(paidEligible({ mode: 'swap' })).toBe(false);
  });

  // ----------------------------------------------------------------
  // Test 12: Multiple skill overlaps increase score
  // ----------------------------------------------------------------
  test('12. multiple overlapping skills increase the score', () => {
    const me = mockUser({
      _id: 'me',
      offered: [
        { skill: 'react', mode: 'swap', hourlyRate: null },
        { skill: 'python', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['guitar', 'piano'],
    });
    const other1 = mockUser({
      _id: 'other1',
      offered: [{ skill: 'guitar', mode: 'swap', hourlyRate: null }],
      wanted: ['react'],
    });
    const other2 = mockUser({
      _id: 'other2',
      offered: [
        { skill: 'guitar', mode: 'swap', hourlyRate: null },
        { skill: 'piano', mode: 'swap', hourlyRate: null },
      ],
      wanted: ['react', 'python'],
    });

    const match1 = computeMatch(me, other1);
    const match2 = computeMatch(me, other2);

    const score1 = match1.categories.find((c) => c.type === 'mutual-swap').score;
    const score2 = match2.categories.find((c) => c.type === 'mutual-swap').score;

    expect(score2).toBeGreaterThan(score1);
  });

  // ----------------------------------------------------------------
  // Test 13: normalizeSkill function
  // ----------------------------------------------------------------
  test('13. normalizeSkill trims, lowercases, and resolves aliases', () => {
    expect(normalizeSkill('  JavaScript ')).toBe('javascript');
    expect(normalizeSkill('JS')).toBe('javascript');
    expect(normalizeSkill('ReactJS')).toBe('react');
    expect(normalizeSkill('ML')).toBe('machine learning');
    expect(normalizeSkill('  Py  ')).toBe('python');
    expect(normalizeSkill('custom skill')).toBe('custom skill');
    expect(normalizeSkill('')).toBe('');
    expect(normalizeSkill(null)).toBe('');
  });
});
