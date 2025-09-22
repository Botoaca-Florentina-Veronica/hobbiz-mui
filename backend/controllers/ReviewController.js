const Review = require('../models/Review');
const User = require('../models/User');

// Create a review for a user
const createReview = async (req, res) => {
  try {
    const authorId = req.userId; // may be undefined if route not protected
    const { user: reviewedUserId, score, comment } = req.body;
    console.log('[ReviewController] createReview called, req.userId=', authorId, 'payload=', req.body);
    if (!reviewedUserId || typeof score === 'undefined') {
      return res.status(400).json({ error: 'Lipsește user sau rating' });
    }
    const parsedScore = Number(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
      return res.status(400).json({ error: 'Scor invalid' });
    }

    // Optionally, verify reviewed user exists
    const reviewed = await User.findById(reviewedUserId);
    if (!reviewed) return res.status(404).json({ error: 'Utilizatorul revizuit nu există' });

    const review = new Review({
      user: reviewedUserId,
      author: authorId,
      score: parsedScore,
      comment: comment || ''
    });
  await review.save();
  console.log('[ReviewController] review saved with id=', review._id);

    // Attach review reference to the reviewed user's document for quick lookup
    try {
      await User.findByIdAndUpdate(reviewedUserId, { $push: { reviews: review._id } });
    } catch (pushErr) {
      console.warn('Nu am putut actualiza câmpul reviews al user-ului:', pushErr.message);
    }

    // Build enriched review response including basic author info if available
    let enriched = review.toObject();
    if (authorId) {
      try {
        const authorDoc = await User.findById(authorId).select('firstName lastName avatar').lean();
        if (authorDoc) {
          enriched.authorName = `${authorDoc.firstName || ''}${authorDoc.lastName ? ' ' + authorDoc.lastName : ''}`.trim();
          enriched.authorAvatar = authorDoc.avatar;
        }
      } catch (e) {
        // ignore
      }
    }

    res.status(201).json({ message: 'Recenzie creată', review: enriched });
  } catch (e) {
    console.error('Eroare createReview:', e);
    res.status(500).json({ error: 'Eroare server la crearea recenziei' });
  }
};

// List reviews for a user (public)
const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Lipsește userId' });
    const reviews = await Review.find({ user: userId }).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  } catch (e) {
    console.error('Eroare getReviewsForUser:', e);
    res.status(500).json({ error: 'Eroare server la preluare recenzii' });
  }
};

module.exports = { createReview, getReviewsForUser };
