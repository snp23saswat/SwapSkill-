const express = require('express');
const router = express.Router();
const { skillCategories, aliasMap, skillLookup } = require('../data/skills');

/**
 * GET /api/skills
 * Returns the full skill catalog grouped by category, plus the alias map.
 * Public endpoint (no auth required).
 */
router.get('/', (req, res) => {
  res.json({
    categories: skillCategories,
    aliasMap,
    allSkills: Object.values(skillLookup),
  });
});

module.exports = router;
