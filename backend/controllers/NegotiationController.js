// controllers/NegotiationController.js
const Negotiation = require('../models/Negotiation');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../services/encryptionService');

// Create a new negotiation (buyer proposes a price)
exports.createNegotiation = async (req, res) => {
  try {
    const { announcementId, proposedPrice, message } = req.body;
    const buyerId = req.userId;

    if (!announcementId || !proposedPrice) {
      return res.status(400).json({ message: 'Announcement ID and proposed price are required' });
    }

    // Verify announcement exists
    const announcement = await Announcement.findById(announcementId).populate('user');
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const sellerId = announcement.user._id.toString();

    // Buyer cannot negotiate with themselves
    if (buyerId === sellerId) {
      return res.status(400).json({ message: 'You cannot negotiate with yourself' });
    }

    // Check if there's already an active negotiation for this buyer-announcement pair
    const existingNegotiation = await Negotiation.findOne({
      announcement: announcementId,
      buyer: buyerId,
      status: { $in: ['pending', 'counter_offer', 'accepted'] }
    });

    if (existingNegotiation) {
      return res.status(400).json({ 
        message: 'You already have an active negotiation for this announcement',
        negotiationId: existingNegotiation._id
      });
    }

    // Create new negotiation
    const negotiation = new Negotiation({
      announcement: announcementId,
      buyer: buyerId,
      seller: sellerId,
      currentPrice: proposedPrice,
      status: 'pending',
      lastActionBy: buyerId,
      offerHistory: [{
        offeredBy: buyerId,
        price: proposedPrice,
        message: message || '',
        action: 'offer'
      }]
    });

    await negotiation.save();

    // Populate for response
    await negotiation.populate([
      { path: 'buyer', select: 'firstName lastName avatar' },
      { path: 'seller', select: 'firstName lastName avatar' },
      { path: 'announcement', select: 'title images' }
    ]);

    // Create a chat message that reflects the negotiation offer so it appears in both chats
    try {
      // Build deterministic conversationId scoped by announcement
      let conversationId;
      try {
        const ownerId = String(announcement.user);
        const otherId = String(buyerId);
        conversationId = [ownerId, otherId, announcementId].join('-');
      } catch (e) {
        conversationId = [String(buyerId), String(sellerId)].sort().join('-');
      }

      const messageData = {
        conversationId,
        senderId: buyerId,
        senderRole: 'cumparator',
        destinatarId: sellerId,
        text: encrypt(`Propunere: ${proposedPrice} RON${message ? '\n' + String(message) : ''}`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: proposedPrice, action: 'offer' },
        announcementId: announcementId
      };

      const sysMsg = await new Message(messageData).save();
      const sysMsgResponse = sysMsg.toObject();
      sysMsgResponse.text = decrypt(sysMsgResponse.text);

      // Try to emit real-time message to both participants
      try {
        const io = req.app && req.app.get ? req.app.get('io') : null;
        const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
        let senderInfo = null;
        try {
          const buyerUser = await User.findById(buyerId).select('firstName lastName avatar');
          if (buyerUser) senderInfo = { firstName: buyerUser.firstName, lastName: buyerUser.lastName, avatar: buyerUser.avatar };
        } catch (_) {}

        if (io && activeUsers) {
          const sellerSocket = activeUsers.get(String(sellerId));
          const buyerSocket = activeUsers.get(String(buyerId));
          if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...sysMsgResponse, senderInfo });
          if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...sysMsgResponse, senderInfo });
        }
      } catch (_) {}
    } catch (e) {
      console.warn('Nu s-a putut crea mesajul de negociere:', e?.message || e);
    }

    // Create a notification for the seller and attempt to send push (fire-and-forget)
    (async () => {
      try {
        const Notification = require('../models/Notification');
        const seller = await User.findById(sellerId).select('pushToken firstName lastName notificationSettings');
        const buyerUser = await User.findById(buyerId).select('firstName lastName');
        const buyerName = buyerUser ? (`${buyerUser.firstName || ''} ${buyerUser.lastName || ''}`).trim() || 'Utilizator' : 'Utilizator';
        const notifMessage = `${buyerName} ți-a propus un preț pentru anunțul "${announcement.title || ''}"`;

        await Notification.create({
          userId: sellerId,
          message: notifMessage,
          link: `/negotiations/${negotiation._id}`,
          title: 'Propunere de preț'
        });

        // Try to emit socket event for real-time delivery (if Socket.IO configured)
        try {
          const io = req.app && req.app.get ? req.app.get('io') : null;
          const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
          if (io && activeUsers) {
            const sid = activeUsers.get(String(sellerId));
            if (sid) io.to(sid).emit('newNotification', { userId: sellerId });
          }
        } catch (_) {}

        // Send push notification if seller allows push and has Expo push token(s)
        const settings = seller && seller.notificationSettings ? seller.notificationSettings : {};
        const allowPush = settings.push !== false;
        let tokens = [];
        if (seller && seller.pushToken) {
          if (Array.isArray(seller.pushToken)) tokens = seller.pushToken;
          else if (typeof seller.pushToken === 'string') tokens = [seller.pushToken];
        }
        tokens = tokens.filter((t) => /^ExponentPushToken\[.+\]$/.test(t));

        if (allowPush && tokens.length > 0) {
          const doFetch = (url, opts) => typeof fetch !== 'undefined' ? fetch(url, opts) : require('node-fetch')(url, opts);
          await doFetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: tokens,
              title: 'Propunere de preț',
              body: notifMessage.slice(0, 120),
              data: { link: `/negotiations/${negotiation._id}` },
              priority: 'high',
              sound: 'default'
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.warn('⚠️ Eroare la crearea notificării pentru negociere:', e?.message || e);
      }
    })();

    res.status(201).json({ 
      message: 'Negotiation created successfully', 
      negotiation 
    });
  } catch (error) {
    console.error('Error creating negotiation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all negotiations for the current user (as buyer or seller)
exports.getUserNegotiations = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, role } = req.query; // role can be 'buyer' or 'seller'

    let query = {
      $or: [{ buyer: userId }, { seller: userId }]
    };

    if (status) {
      query.status = status;
    }

    if (role === 'buyer') {
      query = { buyer: userId };
      if (status) query.status = status;
    } else if (role === 'seller') {
      query = { seller: userId };
      if (status) query.status = status;
    }

    const negotiations = await Negotiation.find(query)
      .populate('buyer', 'firstName lastName avatar')
      .populate('seller', 'firstName lastName avatar')
      .populate('announcement', 'title images user')
      .sort({ lastActionAt: -1 });

    res.json({ negotiations });
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get negotiations for a specific announcement
exports.getAnnouncementNegotiations = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const userId = req.userId;

    // Verify announcement exists and user is the owner
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Only the announcement owner can see all negotiations for their announcement
    if (announcement.user.toString() !== userId) {
      // If not the owner, only show the current user's negotiation
      const userNegotiation = await Negotiation.findOne({
        announcement: announcementId,
        buyer: userId
      })
        .populate('buyer', 'firstName lastName avatar')
        .populate('seller', 'firstName lastName avatar')
        .populate('announcement', 'title images');

      return res.json({ negotiations: userNegotiation ? [userNegotiation] : [] });
    }

    // Owner can see all negotiations
    const negotiations = await Negotiation.find({ announcement: announcementId })
      .populate('buyer', 'firstName lastName avatar')
      .populate('seller', 'firstName lastName avatar')
      .populate('announcement', 'title images')
      .sort({ lastActionAt: -1 });

    res.json({ negotiations });
  } catch (error) {
    console.error('Error fetching announcement negotiations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single negotiation by ID
exports.getNegotiationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName avatar')
      .populate('seller', 'firstName lastName avatar')
      .populate('announcement', 'title images user')
      .populate('offerHistory.offeredBy', 'firstName lastName avatar');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer or seller can view the negotiation
    if (negotiation.buyer._id.toString() !== userId && negotiation.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ negotiation });
  } catch (error) {
    console.error('Error fetching negotiation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Seller accepts the current offer
exports.acceptOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only seller can accept
    if (negotiation.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the seller can accept the offer' });
    }

    // Check if negotiation is in a valid state to be accepted
    if (!['pending', 'counter_offer'].includes(negotiation.status)) {
      return res.status(400).json({ message: 'This negotiation cannot be accepted' });
    }

    // Update negotiation status to pending confirmation
    negotiation.status = 'pending_confirmation';
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: negotiation.currentPrice,
      action: 'accept'
    });

    await negotiation.save();

    // add system message indicating acceptance
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }
      const msg = await new Message({
        conversationId,
        senderId: String(negotiation.seller._id),
        senderRole: 'vanzator',
        destinatarId: String(negotiation.buyer._id),
        text: encrypt(`Preț acceptat: ${negotiation.currentPrice} RON. Ambii trebuie să confirmați colaborarea.`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: negotiation.currentPrice, action: 'accept' },
        announcementId: String(negotiation.announcement._id)
      }).save();
      const msgResponse = msg.toObject();
      msgResponse.text = decrypt(msgResponse.text);

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
        const sellerSocket = activeUsers.get(String(negotiation.seller._id));
        let senderInfo = null;
        try { const sellerUser = await User.findById(userId).select('firstName lastName avatar'); if (sellerUser) senderInfo = { firstName: sellerUser.firstName, lastName: sellerUser.lastName, avatar: sellerUser.avatar }; } catch (_) {}
        if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (e) { console.warn('Nu s-a putut crea mesaj pentru acceptare:', e?.message || e); }

    res.json({ 
      message: 'Offer accepted successfully', 
      negotiation 
    });
  } catch (error) {
    console.error('Error accepting offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Seller rejects the current offer
exports.rejectOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { message } = req.body;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only seller can reject
    if (negotiation.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the seller can reject the offer' });
    }

    // Check if negotiation is in a valid state to be rejected
    if (!['pending', 'counter_offer'].includes(negotiation.status)) {
      return res.status(400).json({ message: 'This negotiation cannot be rejected' });
    }

    // Update negotiation status
    negotiation.status = 'rejected';
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: negotiation.currentPrice,
      message: message || '',
      action: 'reject'
    });

    await negotiation.save();

    // add system message indicating rejection
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }
      const msg = await new Message({
        conversationId,
        senderId: String(negotiation.seller._id),
        senderRole: 'vanzator',
        destinatarId: String(negotiation.buyer._id),
        text: encrypt(`Oferta refuzată: ${negotiation.currentPrice} RON${message ? '\n' + String(message) : ''}`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: negotiation.currentPrice, action: 'reject' },
        announcementId: String(negotiation.announcement._id)
      }).save();
      const msgResponse = msg.toObject();
      msgResponse.text = decrypt(msgResponse.text);

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
        const sellerSocket = activeUsers.get(String(negotiation.seller._id));
        let senderInfo = null;
        try { const sellerUser = await User.findById(userId).select('firstName lastName avatar'); if (sellerUser) senderInfo = { firstName: sellerUser.firstName, lastName: sellerUser.lastName, avatar: sellerUser.avatar }; } catch (_) {}
        if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (e) { console.warn('Nu s-a putut crea mesaj pentru refuz:', e?.message || e); }

    res.json({ 
      message: 'Offer rejected', 
      negotiation 
    });
  } catch (error) {
    console.error('Error rejecting offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Seller sends a counter offer
exports.counterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { counterPrice, message } = req.body;

    if (!counterPrice) {
      return res.status(400).json({ message: 'Counter price is required' });
    }

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only seller can send counter offer
    if (negotiation.seller._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the seller can send a counter offer' });
    }

    // Check if negotiation is in a valid state for counter offer
    if (!['pending', 'counter_offer'].includes(negotiation.status)) {
      return res.status(400).json({ message: 'Cannot send counter offer for this negotiation' });
    }

    // Update negotiation
    negotiation.currentPrice = counterPrice;
    negotiation.status = 'counter_offer';
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: counterPrice,
      message: message || '',
      action: 'counter_offer'
    });

    await negotiation.save();

    // add system message for counter offer
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }
      const msg = await new Message({
        conversationId,
        senderId: String(negotiation.seller._id),
        senderRole: 'vanzator',
        destinatarId: String(negotiation.buyer._id),
        text: encrypt(`Contraofertă: ${counterPrice} RON${message ? '\n' + String(message) : ''}`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: counterPrice, action: 'counter_offer' },
        announcementId: String(negotiation.announcement._id)
      }).save();
      const msgResponse = msg.toObject();
      msgResponse.text = decrypt(msgResponse.text);

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
        const sellerSocket = activeUsers.get(String(negotiation.seller._id));
        let senderInfo = null;
        try { const sellerUser = await User.findById(userId).select('firstName lastName avatar'); if (sellerUser) senderInfo = { firstName: sellerUser.firstName, lastName: sellerUser.lastName, avatar: sellerUser.avatar }; } catch (_) {}
        if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (e) { console.warn('Nu s-a putut crea mesaj pentru contraoferta:', e?.message || e); }

    res.json({ 
      message: 'Counter offer sent successfully', 
      negotiation 
    });
  } catch (error) {
    console.error('Error sending counter offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Buyer accepts seller's counter offer
exports.acceptCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer can accept counter offer
    if (negotiation.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the buyer can accept the counter offer' });
    }

    // Check if there's a counter offer to accept
    if (negotiation.status !== 'counter_offer') {
      return res.status(400).json({ message: 'No counter offer to accept' });
    }

    // Update negotiation status
    negotiation.status = 'accepted';
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: negotiation.currentPrice,
      action: 'accept'
    });

    await negotiation.save();

    // add system message indicating acceptance of counter
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }
      const msg = await new Message({
        conversationId,
        senderId: String(negotiation.buyer._id),
        senderRole: 'cumparator',
        destinatarId: String(negotiation.seller._id),
        text: encrypt(`Contraofertă acceptată: ${negotiation.currentPrice} RON`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: negotiation.currentPrice, action: 'accept' },
        announcementId: String(negotiation.announcement._id)
      }).save();
      const msgResponse = msg.toObject();
      msgResponse.text = decrypt(msgResponse.text);

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
        const sellerSocket = activeUsers.get(String(negotiation.seller._id));
        let senderInfo = null;
        try { const buyerUser = await User.findById(userId).select('firstName lastName avatar'); if (buyerUser) senderInfo = { firstName: buyerUser.firstName, lastName: buyerUser.lastName, avatar: buyerUser.avatar }; } catch (_) {}
        if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (e) { console.warn('Nu s-a putut crea mesaj pentru accept counter:', e?.message || e); }

    res.json({ 
      message: 'Counter offer accepted successfully', 
      negotiation 
    });
  } catch (error) {
    console.error('Error accepting counter offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Buyer sends a new offer (responds to counter offer)
exports.buyerCounterOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { newPrice, message } = req.body;

    if (!newPrice) {
      return res.status(400).json({ message: 'New price is required' });
    }

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer can send new offer
    if (negotiation.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the buyer can send a new offer' });
    }

    // Can only respond to counter offer or pending
    if (!['counter_offer', 'pending'].includes(negotiation.status)) {
      return res.status(400).json({ message: 'Cannot send new offer for this negotiation' });
    }

    // Update negotiation
    negotiation.currentPrice = newPrice;
    negotiation.status = 'pending'; // Back to pending, waiting for seller
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: newPrice,
      message: message || '',
      action: 'counter_offer'
    });

    await negotiation.save();

    // add system message for buyer new offer
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }
      const msg = await new Message({
        conversationId,
        senderId: String(negotiation.buyer._id),
        senderRole: 'cumparator',
        destinatarId: String(negotiation.seller._id),
        text: encrypt(`Contraofertă (buyer): ${newPrice} RON${message ? '\n' + String(message) : ''}`),
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: newPrice, action: 'counter_offer' },
        announcementId: String(negotiation.announcement._id)
      }).save();
      const msgResponse = msg.toObject();
      msgResponse.text = decrypt(msgResponse.text);

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
        const sellerSocket = activeUsers.get(String(negotiation.seller._id));
        let senderInfo = null;
        try { const buyerUser = await User.findById(userId).select('firstName lastName avatar'); if (buyerUser) senderInfo = { firstName: buyerUser.firstName, lastName: buyerUser.lastName, avatar: buyerUser.avatar }; } catch (_) {}
        if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
      }
    } catch (e) { console.warn('Nu s-a putut crea mesaj pentru oferta noua:', e?.message || e); }

    res.json({ 
      message: 'New offer sent successfully', 
      negotiation 
    });
  } catch (error) {
    console.error('Error sending new offer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Finalize negotiation (buyer confirms transaction)
exports.finalizeNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName')
      .populate('seller', 'firstName lastName balance')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer can finalize
    if (negotiation.buyer._id.toString() !== userId) {
      return res.status(403).json({ message: 'Only the buyer can finalize the transaction' });
    }

    // Can only finalize if confirmed
    if (negotiation.status !== 'confirmed') {
      return res.status(400).json({ message: 'Can only finalize confirmed collaborations' });
    }

    // Update negotiation
    negotiation.status = 'finalized';
    negotiation.finalizedAt = new Date();
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();

    // Update seller's balance
    const seller = await User.findById(negotiation.seller._id);
    seller.balance = (seller.balance || 0) + negotiation.currentPrice;
    await seller.save();

    await negotiation.save();

    res.json({ 
      message: 'Transaction finalized successfully', 
      negotiation,
      sellerNewBalance: seller.balance
    });
  } catch (error) {
    console.error('Error finalizing negotiation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel negotiation (can be done by buyer or seller if not finalized)
exports.cancelNegotiation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id);

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer or seller can cancel
    if (negotiation.buyer.toString() !== userId && negotiation.seller.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cannot cancel finalized negotiations
    if (negotiation.status === 'finalized') {
      return res.status(400).json({ message: 'Cannot cancel finalized negotiations' });
    }

    // Mark as rejected
    negotiation.status = 'rejected';
    negotiation.lastActionBy = userId;
    negotiation.lastActionAt = new Date();
    // Add history entry
    negotiation.offerHistory.push({
      offeredBy: userId,
      price: negotiation.currentPrice,
      action: 'reject', 
      message: 'Cancelled after acceptance'
    });

    await negotiation.save();

     // Create a chat message that reflects the cancellation
    try {
      let conversationId;
      try {
        const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
        const otherId = String(negotiation.buyer._id);
        conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
      } catch (e) {
        conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
      }

      const msg = await new Message({
        conversationId,
        senderId: userId,
        senderRole: userId === String(negotiation.buyer._id) ? 'cumparator' : 'vanzator',
        destinatarId: userId === String(negotiation.buyer._id) ? String(negotiation.seller._id) : String(negotiation.buyer._id),
        text: `Negociere anulată.`,
        messageType: 'negotiation',
        negotiation: { negotiationId: String(negotiation._id), price: negotiation.currentPrice, action: 'reject' },
        announcementId: String(negotiation.announcement._id)
      }).save();

      const io = req.app && req.app.get ? req.app.get('io') : null;
      const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
      if (io && activeUsers) {
        const destId = userId === String(negotiation.buyer._id) ? String(negotiation.seller._id) : String(negotiation.buyer._id);
        const sourceSocket = activeUsers.get(String(userId));
        const destSocket = activeUsers.get(destId);
        
        let senderInfo = null;
        try { 
            const u = await User.findById(userId).select('firstName lastName avatar'); 
            if (u) senderInfo = { firstName: u.firstName, lastName: u.lastName, avatar: u.avatar }; 
        } catch (_) {}

        if (sourceSocket) io.to(sourceSocket).emit('newMessage', { ...msg.toObject(), senderInfo });
        if (destSocket) io.to(destSocket).emit('newMessage', { ...msg.toObject(), senderInfo });
      }
    } catch (e) {
      console.warn('Nu s-a putut crea mesajul de anulare negociere:', e?.message || e);
    }

    res.json({ 
      message: 'Negotiation cancelled', 
      negotiation 
    });
  } catch (error) {
    console.error('Error cancelling negotiation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm collaboration (both users need to confirm)
exports.confirmCollaboration = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const negotiation = await Negotiation.findById(id)
      .populate('buyer', 'firstName lastName collaborations balance')
      .populate('seller', 'firstName lastName collaborations balance')
      .populate('announcement', 'title');

    if (!negotiation) {
      return res.status(404).json({ message: 'Negotiation not found' });
    }

    // Only buyer or seller can confirm
    if (![negotiation.buyer._id.toString(), negotiation.seller._id.toString()].includes(userId)) {
      return res.status(403).json({ message: 'Only participants can confirm the collaboration' });
    }

    // Can only confirm if status is pending_confirmation
    if (negotiation.status !== 'pending_confirmation') {
      return res.status(400).json({ message: 'Negotiation is not in pending confirmation status' });
    }

    // Check if user already confirmed
    const alreadyConfirmed = negotiation.confirmedBy.some(confirmation => 
      confirmation.user.toString() === userId
    );

    if (!alreadyConfirmed) {
      // Add user confirmation
      negotiation.confirmedBy.push({
        user: userId,
        confirmedAt: new Date()
      });
    }

    // Check if both users have confirmed
    const buyerConfirmed = negotiation.confirmedBy.some(confirmation => 
      confirmation.user.toString() === negotiation.buyer._id.toString()
    );
    const sellerConfirmed = negotiation.confirmedBy.some(confirmation => 
      confirmation.user.toString() === negotiation.seller._id.toString()
    );

    if (buyerConfirmed && sellerConfirmed) {
      // Both confirmed - finalize collaboration
      negotiation.status = 'confirmed';
      negotiation.collaborationConfirmedAt = new Date();
      negotiation.lastActionBy = userId;
      negotiation.lastActionAt = new Date();
      
      negotiation.offerHistory.push({
        offeredBy: userId,
        price: negotiation.currentPrice,
        action: 'confirm'
      });

      // Add collaboration to both users
      const User = require('../models/User');
      const buyer = await User.findById(negotiation.buyer._id);
      const seller = await User.findById(negotiation.seller._id);

      // Add each user to the other's collaborations if not already there
      if (buyer && !buyer.collaborations.includes(negotiation.seller._id.toString())) {
        buyer.collaborations.push(negotiation.seller._id.toString());
        await buyer.save();
      }
      if (seller && !seller.collaborations.includes(negotiation.buyer._id.toString())) {
        seller.collaborations.push(negotiation.buyer._id.toString());
        await seller.save();
      }

      // Update seller's balance
      seller.balance = (seller.balance || 0) + negotiation.currentPrice;
      await seller.save();

      await negotiation.save();

      // Send system message about collaboration confirmation
      try {
        let conversationId;
        try {
          const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
          const otherId = String(negotiation.buyer._id);
          conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
        } catch (e) {
          conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
        }

        const Message = require('../models/Message');
        const { encrypt, decrypt } = require('../services/encryptionService');

        const msg = await new Message({
          conversationId,
          senderId: userId,
          senderRole: userId === negotiation.seller._id.toString() ? 'vanzator' : 'cumparator',
          destinatarId: userId === negotiation.seller._id.toString() ? negotiation.buyer._id : negotiation.seller._id,
          text: encrypt(`Colaborare confirmată! Preț finalizat: ${negotiation.currentPrice} RON. Acum puteți lăsa recenzii unul altuia.`),
          messageType: 'negotiation',
          negotiation: { 
            negotiationId: String(negotiation._id), 
            price: negotiation.currentPrice, 
            action: 'collaboration_confirmed' 
          },
          announcementId: String(negotiation.announcement._id)
        }).save();

        const msgResponse = msg.toObject();
        msgResponse.text = decrypt(msgResponse.text);

        // Send socket messages
        const io = req.app && req.app.get ? req.app.get('io') : null;
        const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
        if (io && activeUsers) {
          const buyerSocket = activeUsers.get(String(negotiation.buyer._id));
          const sellerSocket = activeUsers.get(String(negotiation.seller._id));
          let senderInfo = null;
          try { 
            const senderUser = await User.findById(userId).select('firstName lastName avatar'); 
            if (senderUser) senderInfo = { 
              firstName: senderUser.firstName, 
              lastName: senderUser.lastName, 
              avatar: senderUser.avatar 
            }; 
          } catch (_) {}
          if (buyerSocket) io.to(buyerSocket).emit('newMessage', { ...msgResponse, senderInfo });
          if (sellerSocket) io.to(sellerSocket).emit('newMessage', { ...msgResponse, senderInfo });
        }
      } catch (e) { 
        console.warn('Nu s-a putut crea mesaj pentru confirmarea colaborării:', e?.message || e); 
      }

      return res.json({ 
        message: 'Collaboration confirmed by both users', 
        negotiation,
        collaborationEstablished: true,
        sellerNewBalance: seller.balance
      });
    } else {
      // Only one confirmed so far
      negotiation.lastActionBy = userId;
      negotiation.lastActionAt = new Date();
      await negotiation.save();

      // Send system message about partial confirmation
      try {
        let conversationId;
        try {
          const ownerId = String(negotiation.announcement.user || negotiation.seller._id);
          const otherId = String(negotiation.buyer._id);
          conversationId = [ownerId, otherId, String(negotiation.announcement._id)].join('-');
        } catch (e) {
          conversationId = [String(negotiation.buyer._id), String(negotiation.seller._id)].sort().join('-');
        }

        const Message = require('../models/Message');
        const { encrypt } = require('../services/encryptionService');
        const User = require('../models/User');

        const confirmerName = userId === negotiation.buyer._id.toString() ? 
          `${negotiation.buyer.firstName || ''} ${negotiation.buyer.lastName || ''}`.trim() : 
          `${negotiation.seller.firstName || ''} ${negotiation.seller.lastName || ''}`.trim();

        const msg = await new Message({
          conversationId,
          senderId: userId,
          senderRole: userId === negotiation.seller._id.toString() ? 'vanzator' : 'cumparator',
          destinatarId: userId === negotiation.seller._id.toString() ? negotiation.buyer._id : negotiation.seller._id,
          text: encrypt(`${confirmerName} a confirmat colaborarea. Așteptăm confirmarea celuilalt utilizator.`),
          messageType: 'negotiation',
          negotiation: { 
            negotiationId: String(negotiation._id), 
            price: negotiation.currentPrice, 
            action: 'partial_confirm' 
          },
          announcementId: String(negotiation.announcement._id)
        }).save();

        // Send socket notification (simplified)
        const io = req.app && req.app.get ? req.app.get('io') : null;
        const activeUsers = req.app && req.app.get ? req.app.get('activeUsers') : null;
        if (io && activeUsers) {
          const targetUserId = userId === negotiation.seller._id.toString() ? negotiation.buyer._id : negotiation.seller._id;
          const targetSocket = activeUsers.get(String(targetUserId));
          if (targetSocket) {
            const msgResponse = msg.toObject();
            const { decrypt } = require('../services/encryptionService');
            msgResponse.text = decrypt(msgResponse.text);
            io.to(targetSocket).emit('newMessage', msgResponse);
          }
        }
      } catch (e) { 
        console.warn('Nu s-a putut crea mesaj pentru confirmarea parțială:', e?.message || e); 
      }

      return res.json({ 
        message: 'Your confirmation recorded. Waiting for the other user to confirm.', 
        negotiation,
        collaborationEstablished: false
      });
    }

  } catch (error) {
    console.error('Error confirming collaboration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Direct collaboration with announcement price (no negotiation needed)
exports.directCollaboration = async (req, res) => {
  try {
    const { announcementId, buyerId, sellerId, price, conversationId } = req.body;

    if (!announcementId || !buyerId || !sellerId || !price) {
      return res.status(400).json({ message: 'All fields are required for direct collaboration' });
    }

    // Verify announcement exists and has the specified price
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (!announcement.price || announcement.price !== price) {
      return res.status(400).json({ message: 'Announcement price does not match requested price' });
    }

    // Verify buyer and seller exist
    const buyer = await User.findById(buyerId);
    const seller = await User.findById(sellerId);

    if (!buyer || !seller) {
      return res.status(404).json({ message: 'Buyer or seller not found' });
    }

    // Update seller balance
    seller.balance = (seller.balance || 0) + price;
    await seller.save();

    // Set up collaboration rights
    if (!buyer.collaborations.includes(sellerId)) {
      buyer.collaborations.push(sellerId);
    }
    if (!seller.collaborations.includes(buyerId)) {
      seller.collaborations.push(buyerId);
    }

    await buyer.save();
    await seller.save();

    // Create a system message for the conversation
    if (conversationId) {
      const systemMessage = new Message({
        conversationId,
        senderId: 'system',
        text: encrypt(`Colaborare confirmată pentru prețul de ${price} RON. Balanța vânzătorului a fost actualizată.`),
        messageType: 'collaboration_request'
      });
      await systemMessage.save();
    }

    res.json({
      success: true,
      message: 'Direct collaboration confirmed successfully',
      balanceUpdated: price,
      sellerNewBalance: seller.balance
    });

  } catch (error) {
    console.error('Error in direct collaboration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
