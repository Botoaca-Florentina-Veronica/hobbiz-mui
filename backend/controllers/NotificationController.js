const Notification = require('../models/Notification');
const Message = require('../models/Message');

// Creează un mesaj nou și notificare pentru destinatar
exports.createMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderRole, text } = req.body;
    const message = new Message({ conversationId, senderId, senderRole, text });
    await message.save();

    // Identifică destinatarul
    // conversationId = [annId, sellerId, userId].sort().join('-')
    const ids = conversationId.split('-');
    // senderId este expeditorul, destinatarul e celălalt id (excluzând senderId și annId)
    const annId = ids.find(id => id === message.conversationId.split('-')[0] || id === message.conversationId.split('-')[1]);
    const destinatarId = ids.find(id => id !== senderId && id !== annId);

    // Creează notificare
    if (destinatarId) {
      await Notification.create({
        userId: destinatarId,
        message: `Ai primit un mesaj nou la anunțul #${annId}`,
        link: `/chat/${conversationId}`,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('EROARE LA CREARE MESAJ:', err);
    res.status(500).json({ error: err.message });
  }
};
