// controllers/NegotiationController.js
const Negotiation = require('../models/Negotiation');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const mongoose = require('mongoose');

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

    // Can only finalize if accepted
    if (negotiation.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only finalize accepted negotiations' });
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

    await negotiation.save();

    res.json({ 
      message: 'Negotiation cancelled', 
      negotiation 
    });
  } catch (error) {
    console.error('Error cancelling negotiation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
