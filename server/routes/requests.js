const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createRequest,
  getRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  completeRequest,
  paySession,
} = require('../controllers/requestsController');
const { createReview } = require('../controllers/reviewsController');

router.post('/', auth, createRequest);
router.get('/', auth, getRequests);
router.patch('/:id/accept', auth, acceptRequest);
router.patch('/:id/reject', auth, rejectRequest);
router.patch('/:id/cancel', auth, cancelRequest);
router.patch('/:id/complete', auth, completeRequest);
router.post('/:id/pay', auth, paySession);
router.post('/:id/review', auth, createReview);

module.exports = router;
