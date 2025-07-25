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
const { Types } = require('mongoose');

// Creează un mesaj nou și notificare pentru destinatar
exports.createMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderRole, text, destinatarId, announcementId } = req.body;
    const message = new Message({ conversationId, senderId, senderRole, text });
    await message.save();

    // Identifică destinatarul dacă nu e primit explicit
    let userIdValue = destinatarId;
    if (!userIdValue) {
      // conversationId = [annId, sellerId, userId].sort().join('-')
      const ids = conversationId.split('-');
      // Exclude senderId și annId
      const annId = announcementId || ids[0];
      userIdValue = ids.find(id => id !== senderId && id !== annId);
    }
    // Validare ObjectId
    if (typeof userIdValue === 'string' && /^[a-fA-F0-9]{24}$/.test(userIdValue)) {
      userIdValue = Types.ObjectId(userIdValue);
    }

    // Creează notificare
    if (userIdValue) {
      try {
        const notif = await Notification.create({
          userId: userIdValue,
          message: `Ai primit un mesaj nou la anunțul #${announcementId || ''}`,
          link: `/chat/${conversationId}`,
        });
        console.log('Notificare salvată:', notif);
      } catch (err) {
        console.error('EROARE LA SALVAREA NOTIFICĂRII:', err);
      }
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
