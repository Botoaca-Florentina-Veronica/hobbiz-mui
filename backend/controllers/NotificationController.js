
const Notification = require('../models/Notification');

// Obține toate notificările pentru un user
exports.getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔔 GET /api/notifications/${userId} - cerere primită`);
    
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    console.log(`🔔 Găsite ${notifications.length} notificări pentru userId: ${userId}`);
    console.log('📋 Notificări găsite:', notifications);
    
    res.json(notifications);
  } catch (err) {
    console.error(`❌ Eroare la obținerea notificărilor pentru ${userId}:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Creează o notificare nouă
exports.createNotification = async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    const notif = await Notification.create({ userId, message, link });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marchează o notificare ca citită
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Șterge o notificare
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
