// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Prestatorul care oferă serviciul (proprietarul programului de disponibilitate)
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Clientul care cere slotul
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Anunțul asociat (opțional - neutilizat în v1, rezervat pentru cereri inițiate dintr-un anunț)
  announcement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement'
  },

  date: { type: String, required: true }, // "YYYY-MM-DD"
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true }, // "HH:mm"

  message: { type: String },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },

  // Mesajul din chat asociat acestei cereri, pentru actualizare in-place la accept/respinge/anulare
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date }
});

bookingSchema.index({ provider: 1, date: 1, status: 1 });
bookingSchema.index({ client: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
