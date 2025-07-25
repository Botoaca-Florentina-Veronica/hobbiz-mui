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
    console.log('=== CREEAZĂ MESAJ - REQUEST BODY ===');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=== HEADERS ===');
    console.log(JSON.stringify(req.headers, null, 2));
    
    const { conversationId, senderId, senderRole, text, destinatarId, announcementId, sellerId, userId } = req.body;
    const message = new Message({ conversationId, senderId, senderRole, text });
    await message.save();

    // Identifică destinatarul robust
    let notificationUserId = destinatarId;
    if (!notificationUserId) {
      // conversationId = [announcementId, sellerId, userId].sort().join('-')
      // Preferă sellerId și userId din body dacă există
      if (sellerId && userId) {
        notificationUserId = senderId === sellerId ? userId : sellerId;
      } else {
        // Fallback: parsează din conversationId
        const ids = conversationId.split('-');
        notificationUserId = ids.find(id => id !== senderId && id !== announcementId);
      }
    }
    // Validare și conversie ObjectId robustă
    if (typeof notificationUserId === 'string' && /^[a-fA-F0-9]{24}$/.test(notificationUserId)) {
      try {
        notificationUserId = new Types.ObjectId(notificationUserId);
      } catch (e) {
        console.error('Eroare la conversia ObjectId:', e);
        return res.status(400).json({ error: 'ID destinatar invalid pentru notificare.' });
      }
    }
    if (!notificationUserId || !Types.ObjectId.isValid(notificationUserId)) {
      console.error('Nu s-a putut identifica destinatarul pentru notificare!', notificationUserId);
      return res.status(400).json({ error: 'ID destinatar invalid pentru notificare.' });
    }
    // Creează notificare
    try {
      const notif = await Notification.create({
        userId: notificationUserId,
        message: `Ai primit un mesaj nou la anunțul #${announcementId || ''}`,
        link: `/chat/${conversationId}`,
      });
      console.log('Notificare salvată:', notif);
    } catch (err) {
      console.error('EROARE LA SALVAREA NOTIFICĂRII:', err);
      return res.status(500).json({ error: 'Eroare la salvarea notificării.' });
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
