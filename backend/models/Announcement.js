const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  contactPerson: { type: String, required: true },
  contactEmail: { type: String },
  contactPhone: { type: String },
  price: { type: Number }, // Optional price field - compatible with existing announcements
  tags: { type: [String], default: [] },
  images: [String],
  favoritesCount: { type: Number, default: 0 },
  // Track number of views for displaying in announcement footer
  views: { type: Number, default: 0 },
  // Track if announcement is archived (hidden from main listings)
  archived: { type: Boolean, default: false },
  // Arhivat de un administrator — doar un admin îl poate dezarhiva
  archivedByAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Text index for fast full-text search (used by /search endpoint)
// Weights prioritise title matches over description
announcementSchema.index(
  { title: 'text', category: 'text', location: 'text', description: 'text' },
  { weights: { title: 10, category: 5, location: 3, description: 1 }, name: 'search_text' }
);

module.exports = mongoose.model('Announcement', announcementSchema);
