const mongoose = require('mongoose');
const Review = require('../backend/models/Review');

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hobbiz';

async function main() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to', uri);
    const reviews = await Review.find({}).sort({ createdAt: -1 }).limit(10).lean();
    if (!reviews || reviews.length === 0) {
      console.log('No reviews found');
      process.exit(0);
    }
    reviews.forEach(r => {
      console.log('---');
      console.log('_id:', String(r._id));
      console.log('user:', String(r.user));
      console.log('author:', String(r.author));
      console.log('score:', r.score);
      console.log('comment:', r.comment ? r.comment.substring(0, 120) : '');
      console.log('likes:', (r.likes || []).length, 'unlikes:', (r.unlikes || []).length);
    });
    process.exit(0);
  } catch (e) {
    console.error('Error listing reviews:', e);
    process.exit(1);
  }
}

main();
