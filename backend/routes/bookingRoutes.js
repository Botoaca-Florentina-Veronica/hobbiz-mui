// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/BookingController');
const auth = require('../middleware/auth');

// Sloturi disponibile ale unui prestator - public, vizibil și pentru vizitatori neautentificați
router.get('/availability/:providerId', bookingController.getAvailability);

// Creează o cerere de rezervare
router.post('/', auth, bookingController.createBooking);

// Prestatorul acceptă/respinge cererea
router.post('/:id/respond', auth, bookingController.respondBooking);

// Provider sau client anulează o rezervare în curs/confirmată
router.post('/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router;
