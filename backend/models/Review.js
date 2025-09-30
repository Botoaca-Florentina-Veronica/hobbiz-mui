const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reviewed user
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who left the review (optional)
	score: { type: Number, required: true, min: 0, max: 5 },
	comment: { type: String },
	// Users who liked this review (each user can like once)
	likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
	createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
