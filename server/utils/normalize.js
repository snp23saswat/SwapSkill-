const { aliasMap } = require('../data/skills');

/**
 * Normalize a skill string:
 * 1. Trim whitespace
 * 2. Lowercase
 * 3. Collapse multiple spaces to single space
 * 4. Look up in alias map; if found, return the canonical key
 * 5. Otherwise return the cleaned string as-is (custom skill)
 */
function normalizeSkill(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!cleaned) return '';
  return aliasMap[cleaned] || cleaned;
}

/**
 * Normalize an array of skill strings, removing empty/duplicate entries.
 */
function normalizeSkillArray(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const item of arr) {
    const n = normalizeSkill(item);
    if (n && !seen.has(n)) {
      seen.add(n);
      result.push(n);
    }
  }
  return result;
}

/**
 * Normalize the offered array, including each skill key.
 * Deduplicates by normalized skill key (keeps first occurrence).
 */
function normalizeOffered(offered) {
  if (!Array.isArray(offered)) return [];
  const seen = new Set();
  const result = [];
  for (const entry of offered) {
    if (!entry || !entry.skill) continue;
    const key = normalizeSkill(entry.skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const mode = ['swap', 'paid', 'both'].includes(entry.mode) ? entry.mode : 'swap';
    let hourlyRate = null;
    if (mode === 'paid' || mode === 'both') {
      hourlyRate = Number(entry.hourlyRate);
      if (!hourlyRate || hourlyRate < 50 || hourlyRate > 5000) {
        // Invalid rate for paid mode – default to 50
        hourlyRate = 50;
      }
      hourlyRate = Math.round(hourlyRate);
    }
    result.push({ skill: key, mode, hourlyRate });
  }
  return result;
}

module.exports = { normalizeSkill, normalizeSkillArray, normalizeOffered };
