
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
            // Link may be in two forms: /chat/:conversationId or /chat/:conversationId/:messageId
            const payload = link.split('/chat/')[1] || '';
            const [conversationId, messageId] = payload.split('/').map(p => p && String(p).trim());
            obj.conversationId = conversationId; // Explicitly add conversationId to the object
            try {
              if (messageId) {
                // If a specific message id is provided, try to load that message for exact preview
                const msg = await Message.findById(messageId).select('senderId text image createdAt conversationId');
                if (msg && msg.senderId) {
                  const sender = await User.findById(msg.senderId).select('firstName lastName avatar');
                  if (sender) {
                    obj.senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator';
                    obj.senderAvatar = sender.avatar || null;
                    obj.senderId = String(sender._id);
                  }
                  obj.preview = msg.text ? String(msg.text) : (msg.image ? 'Imagine nouă' : obj.message);
                }
                // Regardless, if conversationId looks like it encodes an announcement (owner-other-annId), expose metadata
                if (conversationId) {
                  try {
                    const parts = String(conversationId).split('-');
                    if (parts.length === 3 && /^[a-fA-F0-9]{24}$/.test(parts[2])) {
                      obj.announcementId = parts[2];
                      obj.announcementOwnerId = parts[0];
                      // Try to fetch announcement title and images for better client rendering
                      try {
                        const Announcement = require('../models/Announcement');
                        const ann = await Announcement.findById(obj.announcementId).select('title images');
                        if (ann) {
                          obj.announcementTitle = ann.title || '';
                          // Use first image from images array if available
                          if (ann.images && ann.images.length > 0) {
                            obj.announcementImage = ann.images[0];
                          }
                        }
                      } catch (e) {
                        // ignore if Announcement model not available or fetch fails
                      }
                    }
                  } catch (e) {}
                }
              } else if (conversationId) {
                  // If no messageId, fallback to last incoming message for this conversation
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
                    obj.senderId = String(sender._id);
                  }
                  obj.preview = lastIncoming.text
                    ? String(lastIncoming.text)
                    : (lastIncoming.image ? 'Imagine nouă' : obj.message);
                } else {
                  // fallback: deduce other participant from conversationId
                  const parts = String(conversationId).split('-');
                  const otherId = parts.find(p => p && p !== String(userId));
                  if (otherId) {
                    const sender = await User.findById(otherId).select('firstName lastName avatar');
                    if (sender) {
                      obj.senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || 'Utilizator';
                      obj.senderAvatar = sender.avatar || null;
                      obj.senderId = String(sender._id);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('⚠️ Error enriching chat notification with messageId:', e?.message || e);
            }
          }
        } catch (e) {
          console.warn('⚠️ Eroare enrich notification:', e.message);
        }
        // Normalize avatar/image to absolute URL if it's a relative path
        try {
          const base = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
          
          if (obj.senderAvatar && typeof obj.senderAvatar === 'string' && !/^https?:\/\//i.test(obj.senderAvatar)) {
            const path = obj.senderAvatar.startsWith('/') ? obj.senderAvatar : `/${obj.senderAvatar}`;
            obj.senderAvatar = `${base}${path}`;
          }
          
          if (obj.announcementImage && typeof obj.announcementImage === 'string' && !/^https?:\/\//i.test(obj.announcementImage)) {
            const path = obj.announcementImage.startsWith('/') ? obj.announcementImage : `/${obj.announcementImage}`;
            obj.announcementImage = `${base}${path}`;
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
    const { userId, message, link, title } = req.body;
    const notif = await Notification.create({ userId, message, link, title });
    
    // Emit Socket.IO event for real-time notification
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) {
          io.to(sid).emit('newNotification', { userId });
        }
      }
    } catch (_) {}
    
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
