const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderRole: { type: String, enum: ['cumparator', 'vanzator'], required: true },
  destinatarId: { type: String, required: false },
  text: { type: String, required: false }, // Text nu mai e obligatoriu dacă avem imagine
  image: { type: String, required: false }, // URL sau base64 pentru imagine
  imageFile: { type: String, required: false }, // Numele fișierului original
  isRead: { type: Boolean, default: false }, // Statusul de citit al mesajului
  readAt: { type: Date, default: null }, // Când a fost citit mesajul
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
