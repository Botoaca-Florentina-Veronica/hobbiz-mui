// Script pentru curățarea mesajelor necitite invalide sau orphan
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
require('dotenv').config();

async function cleanupMessages() {
  try {
    // Conectare la baza de date
    const dbUri = process.env.MONGO_URI || 'mongodb://localhost:27017/hobbiz';
    await mongoose.connect(dbUri);
    console.log('✓ Conectat la baza de date');

    // 1. Găsește toate mesajele necitite
    const unreadMessages = await Message.find({ isRead: false });
    console.log(`\n📊 Total mesaje necitite găsite: ${unreadMessages.length}`);

    let fixedCount = 0;
    let invalidSenderCount = 0;
    let invalidRecipientCount = 0;
    let orphanCount = 0;
    let invalidNegotiationCount = 0;
    let deletedMessagesCount = 0;

    for (const message of unreadMessages) {
      let shouldMarkAsRead = false;
      let shouldDelete = false;
      let reason = '';

      // Verifică dacă senderId este valid
      if (!message.senderId || message.senderId === 'undefined') {
        shouldMarkAsRead = true;
        reason = 'senderId invalid';
        invalidSenderCount++;
      }

      // Verifică dacă destinatarId este valid
      if (!shouldMarkAsRead && (!message.destinatarId || message.destinatarId === 'undefined')) {
        shouldMarkAsRead = true;
        reason = 'destinatarId invalid';
        invalidRecipientCount++;
      }

      // Verifică mesajele de negociere cu negotiationId invalid
      if (!shouldMarkAsRead && message.messageType === 'negotiation' && message.negotiation?.negotiationId) {
        try {
          const Negotiation = require('../models/Negotiation');
          const negExists = await Negotiation.exists({ _id: message.negotiation.negotiationId });
          if (!negExists) {
            // Negocierea nu mai există - șterge mesajul complet
            shouldDelete = true;
            reason = 'negociere inexistentă - mesaj șters';
            invalidNegotiationCount++;
          }
        } catch (e) {
          shouldDelete = true;
          reason = 'negotiationId invalid - mesaj șters';
          invalidNegotiationCount++;
        }
      }

      // Verifică dacă utilizatorul expeditor există
      if (!shouldMarkAsRead && !shouldDelete && message.senderId) {
        try {
          const senderExists = await User.exists({ _id: message.senderId });
          if (!senderExists) {
            shouldMarkAsRead = true;
            reason = 'expeditor nu există';
            orphanCount++;
          }
        } catch (e) {
          shouldMarkAsRead = true;
          reason = 'expeditor invalid (eroare la verificare)';
          orphanCount++;
        }
      }

      // Verifică dacă utilizatorul destinatar există
      if (!shouldMarkAsRead && !shouldDelete && message.destinatarId) {
        try {
          const recipientExists = await User.exists({ _id: message.destinatarId });
          if (!recipientExists) {
            shouldMarkAsRead = true;
            reason = 'destinatar nu există';
            orphanCount++;
          }
        } catch (e) {
          shouldMarkAsRead = true;
          reason = 'destinatar invalid (eroare la verificare)';
          orphanCount++;
        }
      }

      // Șterge mesajul dacă e de negociere invalidă
      if (shouldDelete) {
        await Message.deleteOne({ _id: message._id });
        deletedMessagesCount++;
        console.log(`  🗑️  Șters: ${message._id} - Motiv: ${reason}`);
      }
      // Altfel, marchează-l ca citit dacă este invalid
      else if (shouldMarkAsRead) {
        await Message.updateOne(
          { _id: message._id },
          { 
            isRead: true, 
            readAt: new Date(),
            // Adaugă un flag pentru a ști că a fost curățat automat
            cleanedUp: true
          }
        );
        fixedCount++;
        console.log(`  ✓ Marcat ca citit: ${message._id} - Motiv: ${reason}`);
      }
    }

    // 2. Curăță și mesajele citite de negociere cu negotiationId invalid
    console.log('\n🔍 Verificare mesaje de negociere citite...');
    const readNegotiationMessages = await Message.find({ 
      messageType: 'negotiation',
      'negotiation.negotiationId': { $exists: true }
    });
    
    let deletedReadNegotiations = 0;
    for (const msg of readNegotiationMessages) {
      if (msg.negotiation?.negotiationId) {
        try {
          const Negotiation = require('../models/Negotiation');
          const negExists = await Negotiation.exists({ _id: msg.negotiation.negotiationId });
          if (!negExists) {
            await Message.deleteOne({ _id: msg._id });
            deletedReadNegotiations++;
            console.log(`  🗑️  Șters mesaj citit: ${msg._id} - negociere inexistentă`);
          }
        } catch (e) {
          await Message.deleteOne({ _id: msg._id });
          deletedReadNegotiations++;
          console.log(`  🗑️  Șters mesaj citit: ${msg._id} - negotiationId invalid`);
        }
      }
    }

    // 3. Afișează statistici
    console.log('\n📈 Statistici cleanup:');
    console.log(`  - Total mesaje necitite procesate: ${unreadMessages.length}`);
    console.log(`  - Mesaje necitite marcate ca citite: ${fixedCount}`);
    console.log(`  - Mesaje necitite de negociere șterse: ${deletedMessagesCount}`);
    console.log(`  - Mesaje citite de negociere șterse: ${deletedReadNegotiations}`);
    console.log(`  - Total mesaje șterse: ${deletedMessagesCount + deletedReadNegotiations}`);
    console.log(`  - Mesaje cu senderId invalid: ${invalidSenderCount}`);
    console.log(`  - Mesaje cu destinatarId invalid: ${invalidRecipientCount}`);
    console.log(`  - Mesaje cu negociere invalidă: ${invalidNegotiationCount}`);
    console.log(`  - Mesaje orphan (utilizatori inexistenți): ${orphanCount}`);
    console.log(`  - Mesaje necitite valide rămase: ${unreadMessages.length - fixedCount - deletedMessagesCount}`);

    // 4. Opțional: Listează conversațiile cu mesaje necitite rămase
    const remainingUnread = await Message.find({ isRead: false });
    if (remainingUnread.length > 0) {
      console.log('\n📋 Conversații cu mesaje necitite valide:');
      const conversationCounts = {};
      remainingUnread.forEach(msg => {
        conversationCounts[msg.conversationId] = (conversationCounts[msg.conversationId] || 0) + 1;
      });
      Object.entries(conversationCounts).forEach(([convId, count]) => {
        console.log(`  - ${convId}: ${count} mesaje necitite`);
      });
    } else {
      console.log('\n✅ Nu mai există mesaje necitite invalide!');
    }

    console.log('\n✅ Cleanup complet!');
    
  } catch (error) {
    console.error('❌ Eroare la cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Deconectat de la baza de date');
  }
}

// Rulează scriptul
if (require.main === module) {
  cleanupMessages()
    .then(() => {
      console.log('\n✨ Script executat cu succes!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Eroare critică:', error);
      process.exit(1);
    });
}

module.exports = cleanupMessages;
