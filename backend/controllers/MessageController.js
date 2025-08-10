const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Types } = require('mongoose');

// Șterge un mesaj după id
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const authenticatedUserId = req.userId;
    
    // Găsim mesajul pentru a verifica proprietatea
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Mesajul nu a fost găsit.' });
    }
    
    // Verificăm că utilizatorul poate șterge mesajul (doar propriile mesaje)
    if (message.senderId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Nu poți șterge mesajele altui utilizator.' });
    }
    
    await Message.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la ștergerea mesajului.' });
  }
};

// Creează un mesaj nou și (opțional) o notificare pentru destinatar
const createMessage = async (req, res) => {
  try {
    console.log('➡️ POST /api/messages - createMessage');
    
    // Verificăm utilizatorul autentificat din middleware
    const authenticatedUserId = req.userId;
    if (!authenticatedUserId) {
      return res.status(401).json({ error: 'Utilizator neautentificat' });
    }
    
  const body = typeof req.body === 'object' && req.body !== null ? req.body : {};
    let {
      conversationId,
      senderId,
      senderRole,
      text,
      destinatarId,
      announcementId,
  image,
  imageFile,
    } = body;
    
    console.log('   • Payload primit (chei):', Object.keys(body));
    
    // Validăm că senderId corespunde cu utilizatorul autentificat
    if (senderId && senderId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Nu poți trimite mesaje în numele altui utilizator' });
    }
    
    // Folosim utilizatorul autentificat ca sender
    senderId = authenticatedUserId;
    
    const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
    
    // Acceptăm mesaje cu text SAU imagine (una dintre ele e necesară)
    const hasText = !!(text && String(text).trim());
    const hasUploadedFile = !!req.file; // din multer
    const hasInlineImage = !!image; // fallback (ex: base64) - nu recomandat
    if (!hasText && !hasUploadedFile && !hasInlineImage) {
      return res.status(400).json({ error: 'Mesajul trebuie să conțină text sau imagine' });
    }
    
    // Asigurăm că avem un destinatar
    if (!destinatarId) {
      return res.status(400).json({
        error: 'Destinatarul este obligatoriu',
      });
    }
    
    // Generăm conversationId automat
    const participants = [senderId, destinatarId].sort();
    conversationId = participants.join('-');
    
    const messageData = {
      conversationId,
      senderId,
      senderRole: senderRole || 'cumparator',
      destinatarId,
      createdAt: new Date(),
    };
    
    if (hasText) messageData.text = String(text).trim();
    // Imagine încărcată prin Cloudinary (multer)
    if (req.file && req.file.path) {
      messageData.image = req.file.path; // URL-ul public Cloudinary
      // req.file.originalname nu e disponibil cu CloudinaryStorage; folosim filename dacă e disponibil
      messageData.imageFile = req.file.originalname || req.file.filename || messageData.imageFile;
    } else if (image) {
      // fallback pentru compatibilitate (ex. base64) – recomandat să migrezi către upload multipart
      messageData.image = image;
      if (imageFile) messageData.imageFile = imageFile;
    }
    
    console.log('   • Salvăm mesajul în MongoDB...');
    const message = await new Message(messageData).save();
    console.log('✅ Mesaj salvat:', message._id);
    
    // Notificare – doar dacă avem un destinatar valid și diferit de expeditor
    if (isValidObjectId(destinatarId) && String(destinatarId) !== String(senderId)) {
      try {
        const link = `/chat/${conversationId}`;
        const existingNotification = await Notification.findOne({
          userId: destinatarId,
          link,
          read: false,
        });
        
        if (!existingNotification) {
          await Notification.create({
            userId: destinatarId,
            message: `Ai primit un mesaj nou${announcementId ? ` la anunțul #${announcementId}` : ''}`,
            link,
          });
        }
      } catch (notifErr) {
        console.warn('⚠️ Eroare la crearea notificării (non-fatal):', notifErr.message);
      }
    }
    
    return res.status(201).json(message);
  } catch (err) {
    console.error('❌ EROARE createMessage:', err);
    return res.status(500).json({
      error: err.message || 'Eroare internă la crearea mesajului',
      code: err.code,
      name: err.name,
    });
  }
};

// Obține toate conversațiile pentru un utilizator
const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul solicită propriile conversații
    if (userId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Nu poți accesa conversațiile altui utilizator' });
    }
    
    // Găsim toate mesajele în care utilizatorul este implicat
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { destinatarId: userId },
        { conversationId: { $regex: userId } } // conversationId conține userId-ul
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Găsite ${messages.length} mesaje pentru utilizatorul ${userId}`);
    
    // Grupăm mesajele pe utilizatori
    const userConversationMap = new Map();
    
    for (const message of messages) {
      // Identificăm celalalt participant
      let otherParticipantId = null;
      
      if (message.senderId === userId) {
        // Mesajul este trimis de utilizatorul curent
        otherParticipantId = message.destinatarId;
      } else {
        // Mesajul este primit, expeditorul este celalalt participant
        otherParticipantId = message.senderId;
      }
      
      // Verificăm dacă celalalt participant este valid și diferit
      if (!otherParticipantId || otherParticipantId === userId) {
        console.log(`Ignorăm mesajul ${message._id} - participant invalid:`, otherParticipantId);
        continue;
      }
      
      // Dacă nu avem deja acest utilizator în map, îl adăugăm
      if (!userConversationMap.has(otherParticipantId)) {
        try {
          const otherUser = await User.findById(otherParticipantId).select('firstName lastName avatar lastSeen');
          
          if (otherUser) {
            userConversationMap.set(otherParticipantId, {
              conversationId: message.conversationId,
              otherParticipant: {
                id: otherParticipantId,
                firstName: otherUser.firstName || 'Utilizator',
                lastName: otherUser.lastName || 'Necunoscut',
                avatar: otherUser.avatar || null,
                lastSeen: otherUser.lastSeen
              },
              lastMessage: {
                text: message.text,
                senderId: message.senderId,
                createdAt: message.createdAt
              },
              unread: false // Aici poți implementa logica pentru mesaje necitite
            });
          }
        } catch (error) {
          console.error('Eroare la preluarea datelor utilizatorului:', error);
        }
      } else {
        // Actualizăm ultimul mesaj dacă mesajul curent este mai recent
        const existingConversation = userConversationMap.get(otherParticipantId);
        if (new Date(message.createdAt) > new Date(existingConversation.lastMessage.createdAt)) {
          existingConversation.lastMessage = {
            text: message.text,
            senderId: message.senderId,
            createdAt: message.createdAt
          };
          existingConversation.conversationId = message.conversationId;
        }
      }
    }
    
    // Convertim Map-ul în array și sortăm după data ultimului mesaj
    const conversations = Array.from(userConversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );
    
    console.log(`Găsite ${conversations.length} conversații unice pentru utilizatorul ${userId}`);
    
    res.json(conversations);
  } catch (err) {
    console.error('Eroare la preluarea conversațiilor:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obține toate mesajele între doi utilizatori
const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul autentificat este unul dintre participanți
    if (authenticatedUserId !== userId1 && authenticatedUserId !== userId2) {
      return res.status(403).json({ error: 'Nu poți accesa conversațiile altui utilizator' });
    }
    
    console.log(`Căutăm mesaje între ${userId1} și ${userId2}`);
    
    // Căutăm mesajele între cei doi utilizatori
    const messages = await Message.find({
      $or: [
        { senderId: userId1, destinatarId: userId2 },
        { senderId: userId2, destinatarId: userId1 },
        // Căutăm și în conversationId pentru compatibilitate cu mesajele vechi
        {
          $and: [
            { conversationId: { $regex: userId1 } },
            { conversationId: { $regex: userId2 } }
          ]
        }
      ]
    }).sort({ createdAt: 1 });
    
    console.log(`Query găsit: ${messages.length} mesaje`);
    
    // Preluam informațiile utilizatorilor pentru fiecare mesaj
    const messagesWithUserData = await Promise.all(
      messages.map(async (message) => {
        try {
          const sender = await User.findById(message.senderId).select('firstName lastName avatar');
          return {
            ...message.toObject(),
            senderInfo: sender ? {
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            } : null
          };
        } catch (error) {
          console.error('Eroare la preluarea datelor utilizatorului:', error);
          return {
            ...message.toObject(),
            senderInfo: null
          };
        }
      })
    );
    
    console.log(`Răspuns final: ${messagesWithUserData.length} mesaje cu date utilizatori`);
    res.json(messagesWithUserData);
  } catch (err) {
    console.error('Eroare la preluarea mesajelor între utilizatori:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obține toate mesajele pentru o conversație cu datele utilizatorilor
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const authenticatedUserId = req.userId;
    
    // Verificăm că utilizatorul autentificat face parte din conversație
    const participants = conversationId.split('-');
    if (!participants.includes(authenticatedUserId)) {
      return res.status(403).json({ error: 'Nu poți accesa această conversație' });
    }
    
    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    
    // Preluam informațiile utilizatorilor pentru fiecare mesaj
    const messagesWithUserData = await Promise.all(
      messages.map(async (message) => {
        try {
          const sender = await User.findById(message.senderId).select('firstName lastName avatar');
          return {
            ...message.toObject(),
            senderInfo: sender ? {
              firstName: sender.firstName,
              lastName: sender.lastName,
              avatar: sender.avatar
            } : null
          };
        } catch (error) {
          console.error('Eroare la preluarea datelor utilizatorului:', error);
          return {
            ...message.toObject(),
            senderInfo: null
          };
        }
      })
    );
    
    res.json(messagesWithUserData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marchează mesajele ca citite
const markMessagesAsRead = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    
    if (!userId || !otherUserId) {
      return res.status(400).json({ error: 'userId și otherUserId sunt necesare' });
    }
    
    // Găsește conversația între cei doi utilizatori
    const participants = [userId, otherUserId].sort();
    const conversationId = participants.join('-');
    
    // Marchează toate mesajele necitite din această conversație care NU sunt ale utilizatorului curent ca fiind citite
    const result = await Message.updateMany(
      { 
        conversationId: conversationId,
        senderId: { $ne: userId }, // Mesajele care NU sunt ale utilizatorului curent
        isRead: false // Doar mesajele necitite
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
    
    res.json({ 
      message: 'Mesajele au fost marcate ca citite',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createMessage,
  deleteMessage,
  getConversations,
  getMessagesBetweenUsers,
  getMessages,
  markMessagesAsRead
};
