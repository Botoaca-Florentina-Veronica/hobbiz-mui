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
const User = require('../models/User');
const { Types } = require('mongoose');

// Creează un mesaj nou și notificare pentru destinatar
exports.createMessage = async (req, res) => {
  try {
    console.log('🚀🚀🚀 === APEL CREATEMESSAGE ===');
    console.log('🚀 Timestamp:', new Date().toISOString());
    console.log('🚀 Request body:', req.body);
    console.log('🚀 Request ID (dacă există):', req.id || 'N/A');
    console.log('=== CREEAZĂ MESAJ - REQUEST BODY ===');
    console.log(JSON.stringify(req.body, null, 2));
    console.log('=== HEADERS ===');
    console.log(JSON.stringify(req.headers, null, 2));
    
    const { conversationId, senderId, text, destinatarId, announcementId } = req.body;
    
    // Validare de bază
    if (!conversationId || !senderId || !text || !destinatarId) {
      console.error('❌ Date obligatorii lipsă:', { conversationId, senderId, text, destinatarId });
      return res.status(400).json({ error: 'Date obligatorii lipsă pentru mesaj.' });
    }
    
    const message = new Message({ 
      conversationId, 
      senderId, 
      text,
      createdAt: new Date()
    });
    
    await message.save();
    console.log('✅ Mesaj salvat:', message);

    // Creează notificare pentru destinatar
    const notificationUserId = destinatarId;
    // Creează notificare pentru destinatar (doar dacă nu e același cu expeditorul)
    if (notificationUserId !== senderId) {
      try {
        console.log('🔔 Verificare notificare duplicată...');
        console.log('🔔 User ID pentru notificare:', notificationUserId);
        console.log('🔔 Link conversație:', `/chat/${conversationId}`);
        
        // Verifică dacă există deja o notificare necitită pentru această conversație
        const existingNotification = await Notification.findOne({
          userId: notificationUserId,
          link: `/chat/${conversationId}`,
          read: false
        });
        
        if (existingNotification) {
          console.log('⚠️ NOTIFICARE DUPLICATĂ găsită! Se sare peste crearea unei noi:', existingNotification._id);
        } else {
          console.log('✅ Nu s-a găsit notificare duplicată, se creează una nouă...');
          const notif = await Notification.create({
            userId: notificationUserId,
            message: `Ai primit un mesaj nou${announcementId ? ` la anunțul #${announcementId}` : ''}`,
            link: `/chat/${conversationId}`,
          });
          console.log('✅ Notificare nouă salvată:', notif);
        }
      } catch (err) {
        console.error('EROARE LA SALVAREA NOTIFICĂRII:', err);
        // Nu returnăm eroare aici pentru că mesajul s-a salvat cu succes
      }
    }

    res.status(201).json(message);
  } catch (err) {
    console.error('EROARE LA CREARE MESAJ:', err);
    res.status(500).json({ error: err.message });
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
