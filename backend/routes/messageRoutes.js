const express = require('express');
const router = express.Router();
const { createMessage, deleteMessage, getConversations, getMessagesBetweenUsers, getMessages, markMessagesAsRead } = require('../controllers/MessageController');
const auth = require('../middleware/auth');
const upload = require('../config/cloudinaryMulter');

// Creează un mesaj nou
router.post('/', auth, upload.single('image'), createMessage);

// Șterge un mesaj după id
router.delete('/:id', auth, deleteMessage);

// Obține conversațiile pentru un utilizator
router.get('/conversations/:userId', auth, getConversations);

// Obține mesajele între doi utilizatori
router.get('/between/:userId1/:userId2', auth, getMessagesBetweenUsers);

// Marchează mesajele ca citite
router.put('/mark-read/:userId/:otherUserId', auth, markMessagesAsRead);

module.exports = router;
