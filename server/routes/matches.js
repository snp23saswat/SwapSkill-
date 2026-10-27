const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMatches } = require('../controllers/matchesController');

router.get('/', auth, getMatches);

module.exports = router;
