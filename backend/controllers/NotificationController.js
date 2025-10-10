
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const User = require('../models/User');

// Obține toate notificările pentru un user
// Îmbogățim cu detalii de expeditor pentru notificările de tip chat (/chat/:conversationId)
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔔 GET /api/notifications/${userId} - cerere primită`);
    
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    console.log(`🔔 Găsite ${notifications.length} notificări pentru userId: ${userId}`);

    // Enrich: pentru notificările care conțin link către chat, încercăm să obținem expeditorul și un preview
    const enriched = await Promise.all(
      notifications.map(async (n) => {
        const obj = n.toObject();
        // ensure createdAt exists as ISO
        if (!obj.createdAt && n.createdAt) obj.createdAt = n.createdAt;
        try {
          const link = obj.link || '';
          if (typeof link === 'string' && link.startsWith('/chat/')) {
            const conversationId = link.split('/chat/')[1];
            if (conversationId) {
              // Căutăm ultimul mesaj primit de acest user în conversația respectivă
              const lastIncoming = await Message.findOne({
                conversationId,
                destinatarId: userId,
              })
                .sort({ createdAt: -1 })
                .select('senderId text image createdAt');

              if (lastIncoming && lastIncoming.senderId) {
                const sender = await User.findById(lastIncoming.senderId).select('firstName lastName avatar');
                if (sender) {
                  obj.senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator';
                  obj.senderAvatar = sender.avatar || null;
                }
                // Preview: text sau mențiune pentru imagine
                obj.preview = lastIncoming.text
                  ? String(lastIncoming.text)
                  : (lastIncoming.image ? 'Imagine nouă' : obj.message);
              } else {
                // fallback: încearcă să deduci celălalt participant din conversationId
                const parts = String(conversationId).split('-');
                const otherId = parts.find(p => p && p !== String(userId));
                if (otherId) {
                  const sender = await User.findById(otherId).select('firstName lastName avatar');
                  if (sender) {
                    obj.senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator';
                    obj.senderAvatar = sender.avatar || null;
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('⚠️ Eroare enrich notification:', e.message);
        }
        // Normalize avatar to absolute URL if it's a relative path
        try {
          if (obj.senderAvatar && typeof obj.senderAvatar === 'string' && !/^https?:\/\//i.test(obj.senderAvatar)) {
            const base = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
            const path = obj.senderAvatar.startsWith('/') ? obj.senderAvatar : `/${obj.senderAvatar}`;
            obj.senderAvatar = `${base}${path}`;
          }
        } catch (_) {}
        return obj;
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error(`❌ Eroare la obținerea notificărilor pentru ${userId}:`, err);
    res.status(500).json({ error: err.message });
  }
};

// Creează o notificare nouă
const createNotification = async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    const notif = await Notification.create({ userId, message, link });
    res.status(201).json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marchează o notificare ca citită
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Șterge o notificare
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/notifications/${id} - cerere primită`);
    
    const result = await Notification.findByIdAndDelete(id);
    console.log('🗑️ Rezultat ștergere:', result);
    
    if (!result) {
      console.log('❌ Notificarea nu a fost găsită');
      return res.status(404).json({ error: 'Notificarea nu a fost găsită' });
    }
    
    console.log('✅ Notificare ștearsă cu succes');
    res.json({ success: true, message: 'Notificare ștearsă cu succes' });
  } catch (err) {
    console.error('❌ Eroare la ștergerea notificării:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification
};
