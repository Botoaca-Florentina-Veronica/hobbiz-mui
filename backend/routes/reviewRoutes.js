const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { createReview, getReviewsForUser, setReaction, toggleLike, toggleUnlike, updateReview, deleteReview } = require('../controllers/ReviewController');

// Public: list reviews for a given user
router.get('/:userId', getReviewsForUser);

// Create review (authentication optional) -- allowing optionalAuth lets guests post reviews while
// keeping req.userId available when the request is authenticated.
router.post('/', optionalAuth, createReview);

// Toggle like on a review (must be authenticated)
router.post('/:id/like', auth, toggleLike);

// Toggle unlike on a review (must be authenticated)
router.post('/:id/unlike', auth, toggleUnlike);
// Unified reaction endpoint
router.post('/:id/react', auth, setReaction);

// Edit a review (author only)
router.put('/:id', auth, updateReview);

// Delete a review (author only)
router.delete('/:id', auth, deleteReview);

module.exports = router;
