const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const auth = require('../middleware/auth');

// Creează un mesaj nou
router.post('/', auth, MessageController.createMessage);

// Obține conversațiile pentru un utilizator
router.get('/conversations/:userId', auth, MessageController.getConversations);

// Obține mesajele între doi utilizatori
router.get('/between/:userId1/:userId2', auth, MessageController.getMessagesBetweenUsers);

// Obține toate mesajele pentru o conversație
router.get('/conversation/:conversationId', auth, MessageController.getMessages);

// Șterge un mesaj după id
router.delete('/:id', auth, MessageController.deleteMessage);

module.exports = router;
