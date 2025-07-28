const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationController = require('../controllers/NotificationController');

// GET toate notificările pentru un user
router.get('/:userId', NotificationController.getNotifications);

// POST creează notificare nouă
router.post('/', NotificationController.createNotification);

// PATCH marchează ca citită
router.patch('/:id/read', NotificationController.markAsRead);

// DELETE șterge notificare (cu autentificare)
router.delete('/:id', auth, NotificationController.deleteNotification);

module.exports = router;
