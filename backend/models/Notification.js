const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  link: { type: String }, // link către chat sau anunț
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model('Notification', NotificationSchema);
