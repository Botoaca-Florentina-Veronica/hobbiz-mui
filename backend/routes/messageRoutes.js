const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

// Creează un mesaj nou
router.post('/', MessageController.createMessage);

// Obține toate mesajele pentru o conversație
router.get('/:conversationId', MessageController.getMessages);

module.exports = router;
