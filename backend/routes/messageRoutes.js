const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinaryMulter');

// Creează un mesaj nou
router.post('/', auth, upload.single('image'), MessageController.createMessage);

// Obține conversațiile pentru un utilizator
router.get('/conversations/:userId', auth, MessageController.getConversationsList);

// Obține mesajele între doi utilizatori
router.get('/between/:userId1/:userId2', auth, MessageController.getMessagesBetweenUsers);

// Marchează mesajele ca citite
router.put('/mark-read/:userId/:otherUserId', auth, MessageController.markMessagesAsRead);

module.exports = router;
