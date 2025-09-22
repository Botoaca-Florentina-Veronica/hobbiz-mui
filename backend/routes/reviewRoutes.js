const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createReview, getReviewsForUser } = require('../controllers/ReviewController');

// Public: list reviews for a given user
router.get('/:userId', getReviewsForUser);

// Create review (auth recommended)
router.post('/', auth, createReview);

module.exports = router;
