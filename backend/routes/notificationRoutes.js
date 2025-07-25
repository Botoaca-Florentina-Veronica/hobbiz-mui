const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');

// GET toate notificările pentru un user
router.get('/:userId', NotificationController.getNotifications);

// POST creează notificare nouă
router.post('/', NotificationController.createNotification);

// PATCH marchează ca citită
router.patch('/:id/read', NotificationController.markAsRead);

// DELETE șterge notificare
router.delete('/:id', NotificationController.deleteNotification);

module.exports = router;
