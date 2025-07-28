const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

// Creează un mesaj nou
router.post('/', MessageController.createMessage);

// Obține conversațiile pentru un utilizator
router.get('/conversations/:userId', MessageController.getConversations);

// Obține mesajele între doi utilizatori
router.get('/between/:userId1/:userId2', MessageController.getMessagesBetweenUsers);

// Obține toate mesajele pentru o conversație
router.get('/conversation/:conversationId', MessageController.getMessages);

// Șterge un mesaj după id
router.delete('/:id', MessageController.deleteMessage);

module.exports = router;
