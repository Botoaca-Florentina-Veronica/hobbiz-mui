const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { createReview, getReviewsForUser } = require('../controllers/ReviewController');

// Public: list reviews for a given user
router.get('/:userId', getReviewsForUser);

// Create review (authentication optional) -- allowing optionalAuth lets guests post reviews while
// keeping req.userId available when the request is authenticated.
router.post('/', optionalAuth, createReview);

module.exports = router;
