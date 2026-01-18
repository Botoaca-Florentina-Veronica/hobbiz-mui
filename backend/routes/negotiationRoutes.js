// routes/negotiationRoutes.js
const express = require('express');
const router = express.Router();
const negotiationController = require('../controllers/NegotiationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a new negotiation (buyer proposes a price)
router.post('/', negotiationController.createNegotiation);

// Get all negotiations for current user
router.get('/', negotiationController.getUserNegotiations);

// Get negotiations for a specific announcement
router.get('/announcement/:announcementId', negotiationController.getAnnouncementNegotiations);

// Get a single negotiation by ID
router.get('/:id', negotiationController.getNegotiationById);

// Seller accepts the current offer
router.post('/:id/accept', negotiationController.acceptOffer);

// Seller rejects the current offer
router.post('/:id/reject', negotiationController.rejectOffer);

// Seller sends a counter offer
router.post('/:id/counter-offer', negotiationController.counterOffer);

// Buyer accepts seller's counter offer
router.post('/:id/accept-counter', negotiationController.acceptCounterOffer);

// Buyer sends a new offer (responds to counter offer)
router.post('/:id/buyer-counter', negotiationController.buyerCounterOffer);

// Finalize negotiation (buyer confirms transaction)
router.post('/:id/finalize', negotiationController.finalizeNegotiation);

// Cancel negotiation
router.delete('/:id', negotiationController.cancelNegotiation);

module.exports = router;
