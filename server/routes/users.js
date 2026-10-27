const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { updateProfile, getPublicProfile } = require('../controllers/userController');
const { getUserReviews } = require('../controllers/reviewsController');

router.put('/me', auth, updateProfile);
router.get('/:id', auth, getPublicProfile);
router.get('/:id/reviews', auth, getUserReviews);

module.exports = router;
