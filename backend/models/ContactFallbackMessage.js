const mongoose = require('mongoose');

const ContactFallbackMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mailError: {
    message: { type: String, maxlength: 500 },
    code: { type: String, maxlength: 100 },
    raw: { type: String, maxlength: 2000 }
  },
  source: { type: String, default: 'contact-form' },
  ip: { type: String, maxlength: 80 },
  userAgent: { type: String, maxlength: 400 },
  createdAt: { type: Date, default: Date.now }
});

ContactFallbackMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactFallbackMessage', ContactFallbackMessageSchema);
