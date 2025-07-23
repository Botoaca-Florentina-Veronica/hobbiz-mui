const Message = require('../models/Message');

// Creează un mesaj nou
exports.createMessage = async (req, res) => {
  try {
    const { conversationId, senderId, senderRole, text } = req.body;
    const message = new Message({ conversationId, senderId, senderRole, text });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
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
