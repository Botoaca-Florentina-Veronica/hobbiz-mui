// models/Negotiation.js
const mongoose = require('mongoose');

const negotiationSchema = new mongoose.Schema({
  // Reference to the announcement being negotiated
  announcement: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Announcement', 
    required: true 
  },
  
  // Buyer (the one who initiates the negotiation)
  buyer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Seller (the owner of the announcement)
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Original price from announcement (if applicable)
  originalPrice: { 
    type: Number 
  },
  
  // Current negotiated price
  currentPrice: { 
    type: Number, 
    required: true 
  },
  
  // Status of the negotiation
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'rejected', 'counter_offer', 'finalized'], 
    default: 'pending' 
  },
  
  // History of offers made during negotiation
  offerHistory: [{
    offeredBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    price: { 
      type: Number, 
      required: true 
    },
    message: { 
      type: String 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
    action: { 
      type: String, 
      enum: ['offer', 'counter_offer', 'accept', 'reject'],
      required: true
    }
  }],
  
  // When the negotiation was finalized (transaction confirmed by buyer)
  finalizedAt: { 
    type: Date 
  },
  
  // Last action taken
  lastActionBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // Last action timestamp
  lastActionAt: { 
    type: Date, 
    default: Date.now 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
negotiationSchema.index({ announcement: 1, buyer: 1, seller: 1 });
negotiationSchema.index({ buyer: 1, status: 1 });
negotiationSchema.index({ seller: 1, status: 1 });

module.exports = mongoose.model('Negotiation', negotiationSchema);
