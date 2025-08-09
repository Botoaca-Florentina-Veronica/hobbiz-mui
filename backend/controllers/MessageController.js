const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { Types } = require('mongoose');

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

// Creează un mesaj nou și (opțional) o notificare pentru destinatar
exports.createMessage = async (req, res) => {
  try {
    // Log de diagnostic minimal (nu logăm payload-uri mari în producție)
    console.log('➡️ POST /api/messages - createMessage');
    // Afișăm starea conexiunii DB
    try {
      const mongoose = require('mongoose');
      const rs = mongoose.connection?.readyState;
      console.log('   • Mongo readyState:', rs, '(0=disconnected,1=connected,2=connecting,3=disconnecting)');
    } catch {}

    // Asigurăm body-ul ca obiect simplu
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

    const isValidObjectId = (id) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);

    // Normalizează conversationId dacă e format din 2 ObjectId-uri despărțite cu '-'
    if (typeof conversationId === 'string' && conversationId.includes('-')) {
      const parts = conversationId.split('-').filter(Boolean);
      if (parts.length === 2 && isValidObjectId(parts[0]) && isValidObjectId(parts[1])) {
        // sort pentru consistență
        conversationId = parts.sort().join('-');
      }
    }

    // Deducem destinatarId dacă lipsește
    if (!destinatarId && typeof conversationId === 'string') {
      const parts = conversationId.split('-');
      const candidate = parts.find((p) => p !== String(senderId));
      if (isValidObjectId(candidate)) destinatarId = candidate;
    }

    // Validare de bază – trebuie text sau imagine, iar IDs valide
    const missing = [];
    if (!conversationId) missing.push('conversationId');
    if (!senderId) missing.push('senderId');
    if (!text && !image) missing.push('text|image');
    if (!destinatarId) missing.push('destinatarId');
  if (missing.length) {
      return res.status(400).json({
        error: 'Date obligatorii lipsă pentru mesaj',
        missing,
      });
    }

    const messageData = {
      conversationId,
      senderId,
      senderRole: senderRole || 'cumparator',
      destinatarId,
      createdAt: new Date(),
    };

    if (text && String(text).trim()) messageData.text = String(text).trim();
    if (image) {
      messageData.image = image;
      if (imageFile) messageData.imageFile = imageFile;
    }

    // Salvăm mesajul (cu validare Mongoose)
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
        // Logăm dar nu blocăm răspunsul
        console.warn('⚠️ Eroare la crearea notificării (non-fatal):', notifErr.message);
      }
    }

    return res.status(201).json(message);
  } catch (err) {
    // Trimitem detalii utile pentru debugging (message + câteva meta)
    console.error('❌ EROARE createMessage:', err);
    return res.status(500).json({
      error: err.message || 'Eroare internă la crearea mesajului',
      code: err.code,
      name: err.name,
    });
  }
};

// Obține toate conversațiile pentru un utilizator
exports.getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Găsim toate mesajele în care utilizatorul este implicat
    const messages = await Message.find({
      $or: [
        { senderId: userId },
        { conversationId: { $regex: userId } } // conversationId conține userId-ul
      ]
    }).sort({ createdAt: -1 });
    
    console.log(`Găsite ${messages.length} mesaje pentru utilizatorul ${userId}`);
    
    // Grupăm mesajele pe utilizatori (nu pe conversații)
    const userConversationMap = new Map();
    
    for (const message of messages) {
      // Identificăm celalalt participant mai robust
      let otherParticipantId = null;
      
      if (message.senderId === userId) {
        // Mesajul este trimis de utilizatorul curent, căutăm destinatarul în conversationId
        const participants = message.conversationId.split('-').filter(id => 
          id !== userId && 
          id.length === 24 && // ObjectId length
          /^[a-fA-F0-9]{24}$/.test(id) // Valid ObjectId
        );
        
        // Găsim primul participant valid care nu este userId-ul curent
        for (const participantId of participants) {
          if (participantId !== userId) {
            otherParticipantId = participantId;
            break;
          }
        }
      } else {
        // Mesajul este primit, expeditorul este celalalt participant
        otherParticipantId = message.senderId;
      }
      
      // Validăm că am găsit un participant valid
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
              conversationId: message.conversationId, // Folosim conversationId din ultimul mesaj
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
          } else {
            console.log(`Utilizatorul ${otherParticipantId} nu a fost găsit în baza de date`);
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
exports.getMessagesBetweenUsers = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    
    console.log(`Căutăm mesaje între ${userId1} și ${userId2}`);
    
    // Căutăm toate mesajele unde ambii utilizatori sunt implicați
    // Fie unul trimite către celălalt, fie sunt în aceeași conversație
    const messages = await Message.find({
      $or: [
        // Mesaje directe între cei doi utilizatori
        { senderId: userId1, conversationId: { $regex: userId2 } },
        { senderId: userId2, conversationId: { $regex: userId1 } },
        // Mesaje în conversații comune (să zicem că conversationId conține ambii)
        {
          $and: [
            { conversationId: { $regex: userId1 } },
            { conversationId: { $regex: userId2 } }
          ]
        }
      ]
    }).sort({ createdAt: 1 });
    
    console.log(`Query găsit: ${messages.length} mesaje brute`);
    
    // Verificăm fiecare mesaj pentru a ne asigura că este relevant
    const relevantMessages = [];
    for (const message of messages) {
      const convParticipants = message.conversationId.split('-');
      const hasUser1 = convParticipants.includes(userId1);
      const hasUser2 = convParticipants.includes(userId2);
      
      if (hasUser1 && hasUser2) {
        relevantMessages.push(message);
      }
    }
    
    console.log(`Mesaje relevante după verificare: ${relevantMessages.length}`);
    
    // Preluam informațiile utilizatorilor pentru fiecare mesaj
    const messagesWithUserData = await Promise.all(
      relevantMessages.map(async (message) => {
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
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
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
