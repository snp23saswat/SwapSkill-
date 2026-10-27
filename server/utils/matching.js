const { normalizeSkill } = require('./normalize');

/**
 * Check if a skill entry is swap-eligible (mode is "swap" or "both").
 */
function swapEligible(entry) {
  return entry.mode === 'swap' || entry.mode === 'both';
}

/**
 * Check if a skill entry is paid-eligible (mode is "paid" or "both").
 */
function paidEligible(entry) {
  return entry.mode === 'paid' || entry.mode === 'both';
}

/**
 * Compute the intersection of offered skills (filtered) and wanted skills.
 * Returns array of { skill, rate? } objects.
 */
function skillIntersection(offered, wanted, filterFn) {
  const wantedSet = new Set(wanted.map((w) => normalizeSkill(w)));
  const result = [];
  for (const entry of offered) {
    if (!filterFn(entry)) continue;
    const key = normalizeSkill(entry.skill);
    if (wantedSet.has(key)) {
      result.push({
        skill: key,
        ...(paidEligible(entry) ? { rate: entry.hourlyRate } : {}),
      });
    }
  }
  return result;
}

/**
 * Compute match categories for `me` vs `other`.
 *
 * Returns null if no match, otherwise:
 * {
 *   user: { public fields },
 *   categories: [ { type, skills, score } ],
 *   topScore: number
 * }
 */
function computeMatch(me, other) {
  if (me._id.toString() === other._id.toString()) return null;

  const meWanted = me.wanted || [];
  const otherWanted = other.wanted || [];

  // theyTeachMeSwap: other's swap-eligible offered ∩ my wanted
  const theyTeachMeSwap = skillIntersection(other.offered, meWanted, swapEligible);
  // iTeachThemSwap: my swap-eligible offered ∩ other's wanted
  const iTeachThemSwap = skillIntersection(me.offered, otherWanted, swapEligible);

  // theyTeachMePaid: other's paid-eligible offered ∩ my wanted (with rates)
  const theyTeachMePaid = skillIntersection(other.offered, meWanted, paidEligible);
  // iTeachThemPaid: my paid-eligible offered ∩ other's wanted (with my rates)
  const iTeachThemPaid = skillIntersection(me.offered, otherWanted, paidEligible);

  const categories = [];

  // Mutual swap: both directions have swap overlap
  if (theyTeachMeSwap.length > 0 && iTeachThemSwap.length > 0) {
    const overlap = theyTeachMeSwap.length + iTeachThemSwap.length;
    categories.push({
      type: 'mutual-swap',
      theyTeachMe: theyTeachMeSwap,
      iTeachThem: iTeachThemSwap,
      score: 60 + 10 * overlap,
    });
  }

  // Paid tutor: they can teach me for money
  if (theyTeachMePaid.length > 0) {
    categories.push({
      type: 'paid-tutor',
      skills: theyTeachMePaid,
      score: 30 + 5 * theyTeachMePaid.length,
    });
  }

  // Potential student: they want something I sell
  if (iTeachThemPaid.length > 0) {
    categories.push({
      type: 'potential-student',
      skills: iTeachThemPaid,
      score: 20 + 5 * iTeachThemPaid.length,
    });
  }

  // One-way swap: exactly one swap direction is non-empty
  if (
    (theyTeachMeSwap.length > 0 && iTeachThemSwap.length === 0) ||
    (theyTeachMeSwap.length === 0 && iTeachThemSwap.length > 0)
  ) {
    const overlap = theyTeachMeSwap.length + iTeachThemSwap.length;
    categories.push({
      type: 'one-way-swap',
      theyTeachMe: theyTeachMeSwap,
      iTeachThem: iTeachThemSwap,
      score: 10 * overlap,
    });
  }

  if (categories.length === 0) return null;

  let topScore = Math.max(...categories.map((c) => c.score));
  if (other.ratingCount && other.ratingCount >= 3 && other.ratingAverage) {
    topScore += Math.round(2 * other.ratingAverage);
  }

  return {
    user: {
      _id: other._id,
      name: other.name,
      bio: other.bio,
      availability: other.availability,
      sessionsCompleted: other.sessionsCompleted,
      offered: other.offered,
      ratingAverage: other.ratingAverage || 0,
      ratingCount: other.ratingCount || 0,
    },
    categories,
    topScore,
  };
}

/**
 * Find all matches for `me` from a list of `allUsers`.
 * `existingRequests` is an array of SessionRequest documents to exclude
 * duplicate pending/accepted requests for the same skills/type.
 *
 * Returns sorted array of match objects (desc by topScore).
 */
function findMatches(me, allUsers, existingRequests = []) {
  // Build a set of "duplicate" keys: pending/accepted requests between me and other
  const duplicateKeys = new Set();
  for (const req of existingRequests) {
    if (req.status !== 'pending' && req.status !== 'accepted') continue;
    const otherId =
      req.initiatedBy.toString() === me._id.toString()
        ? req.receiver.toString()
        : req.initiatedBy.toString();

    if (req.type === 'swap') {
      // Key: pair + type + skills sorted
      const skills = [req.skillTeachByInitiator, req.skillTeachByReceiver]
        .filter(Boolean)
        .sort()
        .join('|');
      duplicateKeys.add(`${otherId}:swap:${skills}`);
    } else {
      duplicateKeys.add(`${otherId}:paid:${req.skill}`);
    }
  }

  const matches = [];

  for (const other of allUsers) {
    const match = computeMatch(me, other);
    if (!match) continue;

    // Filter out categories where a duplicate request already exists
    match.categories = match.categories.filter((cat) => {
      if (cat.type === 'mutual-swap' || cat.type === 'one-way-swap') {
        const allSkills = [
          ...(cat.theyTeachMe || []).map((s) => s.skill),
          ...(cat.iTeachThem || []).map((s) => s.skill),
        ]
          .sort()
          .join('|');
        return !duplicateKeys.has(`${other._id.toString()}:swap:${allSkills}`);
      }
      if (cat.type === 'paid-tutor') {
        return cat.skills.some(
          (s) => !duplicateKeys.has(`${other._id.toString()}:paid:${s.skill}`)
        );
      }
      if (cat.type === 'potential-student') {
        return cat.skills.some(
          (s) => !duplicateKeys.has(`${other._id.toString()}:paid:${s.skill}`)
        );
      }
      return true;
    });

    if (match.categories.length === 0) continue;

    // Recalculate top score after filtering
    let topScore = Math.max(...match.categories.map((c) => c.score));
    if (other.ratingCount && other.ratingCount >= 3 && other.ratingAverage) {
      topScore += Math.round(2 * other.ratingAverage);
    }
    match.topScore = topScore;
    matches.push(match);
  }

  // Sort descending by topScore
  matches.sort((a, b) => b.topScore - a.topScore);

  return matches;
}

module.exports = {
  swapEligible,
  paidEligible,
  skillIntersection,
  computeMatch,
  findMatches,
};
