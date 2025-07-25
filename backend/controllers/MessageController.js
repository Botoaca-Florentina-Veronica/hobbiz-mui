// Șterge un mesaj după id
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Mesajul nu a fost găsit.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la ștergerea mesajului.' });
  }
};
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// Creează un mesaj nou
exports.createMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderRole, text, destinatarId, announcementId } = req.body;
    const message = new Message({ conversationId, senderId, senderRole, text });
    await message.save();

    // Creează notificare direct pentru destinatarId primit din body
    if (destinatarId) {
      const mongoose = require('mongoose');
      await Notification.create({
        userId: mongoose.Types.ObjectId(destinatarId),
        message: `Ai primit un mesaj nou la anunțul #${announcementId || ''}`,
        link: `/chat/${conversationId}`,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('EROARE LA CREARE MESAJ:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obține toate mesajele pentru o conversație
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
