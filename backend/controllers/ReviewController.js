const Review = require('../models/Review');
const User = require('../models/User');

// Create a review for a user
const createReview = async (req, res) => {
  try {
    const authorId = req.userId; // may be undefined if route not protected
    const { user: reviewedUserId, score, comment } = req.body || {};
    console.log('[ReviewController] createReview called', { userIdHeader: req.header('Authorization'), userAgent: req.header('User-Agent') });
    console.log('[ReviewController] payload:', req.body, 'req.userId=', authorId);

    if (!reviewedUserId || typeof score === 'undefined') {
      return res.status(400).json({ error: 'Lipsește user sau rating' });
    }

    const parsedScore = Number(score);
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > 5) {
      return res.status(400).json({ error: 'Scor invalid' });
    }

    // Verify reviewed user exists
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

    // Return populated review (author and announcement basic info) for frontend convenience
    try {
      const populated = await Review.findById(review._id)
        .populate('author', 'firstName lastName avatar')
        .populate('announcement', 'title')
        .lean();
      // Normalize response shape: include authorName and authorAvatar and announcementTitle for frontend convenience
      const enriched = {
        ...populated,
        authorName: populated.author ? `${populated.author.firstName || ''}${populated.author.lastName ? ' ' + populated.author.lastName : ''}`.trim() : undefined,
        authorAvatar: populated.author ? populated.author.avatar : undefined,
        announcementTitle: populated.announcement ? populated.announcement.title : undefined
      };
      return res.status(201).json({ message: 'Recenzie creată', review: enriched });
    } catch (e) {
      // If populate fails, fallback to returning basic review object
      console.warn('Populate failed for review response:', e.message);
      const obj = review.toObject();
      obj.announcementTitle = undefined;
      return res.status(201).json({ message: 'Recenzie creată', review: obj });
    }
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
    // Populate author basic info to make frontend rendering easier
    const reviews = await Review.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('author', 'firstName lastName avatar')
      .populate('announcement', 'title')
      .lean();
    const mapped = reviews.map(r => ({
      ...r,
      authorName: r.author ? `${r.author.firstName || ''}${r.author.lastName ? ' ' + r.author.lastName : ''}`.trim() : undefined,
      authorAvatar: r.author ? r.author.avatar : undefined,
      score: r.score,
      announcementTitle: r.announcement ? r.announcement.title : undefined,
      announcement: r.announcement ? { _id: r.announcement._id, title: r.announcement.title } : undefined
    }));
    res.json(mapped);
  } catch (e) {
    console.error('Eroare getReviewsForUser:', e);
    res.status(500).json({ error: 'Eroare server la preluare recenzii' });
  }
};

// Toggle like for a review - requires authentication
const toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a da like' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    const idx = (review.likes || []).findIndex(id => String(id) === String(userId));
    let liked = false;
    if (idx === -1) {
      // add like
      review.likes = review.likes || [];
      review.likes.push(userId);
      liked = true;
    } else {
      // remove like
      review.likes.splice(idx, 1);
      liked = false;
    }
    await review.save();

    res.json({ liked, likesCount: (review.likes || []).length });
  } catch (e) {
    console.error('Eroare toggleLike:', e);
    res.status(500).json({ error: 'Eroare server la like' });
  }
};

// Update a review (only the author can update)
const updateReview = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a edita recenzia' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const { score, comment } = req.body || {};
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    if (!review.author || String(review.author) !== String(userId)) {
      return res.status(403).json({ error: 'Nu ai permisiunea de a modifica această recenzie' });
    }

    if (typeof score !== 'undefined') {
      const parsed = Number(score);
      if (isNaN(parsed) || parsed < 0 || parsed > 5) return res.status(400).json({ error: 'Scor invalid' });
      review.score = parsed;
    }
    if (typeof comment !== 'undefined') review.comment = comment;

    await review.save();

    // Return populated updated review
    const populated = await Review.findById(review._id).populate('author', 'firstName lastName avatar').lean();
    const enriched = {
      ...populated,
      authorName: populated.author ? `${populated.author.firstName || ''}${populated.author.lastName ? ' ' + populated.author.lastName : ''}`.trim() : undefined,
      authorAvatar: populated.author ? populated.author.avatar : undefined
    };
    res.json({ message: 'Recenzie actualizată', review: enriched });
  } catch (e) {
    console.error('Eroare updateReview:', e);
    res.status(500).json({ error: 'Eroare server la actualizare recenzie' });
  }
};

// Delete a review (only the author can delete)
const deleteReview = async (req, res) => {
  try {
    const userId = req.userId;
    const reviewId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Trebuie autentificat pentru a șterge recenzia' });
    if (!reviewId) return res.status(400).json({ error: 'Lipsește id review' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Recenzie negăsită' });

    if (!review.author || String(review.author) !== String(userId)) {
      return res.status(403).json({ error: 'Nu ai permisiunea de a șterge această recenzie' });
    }

    // Remove review reference from the reviewed user's reviews array
    try {
      await User.findByIdAndUpdate(review.user, { $pull: { reviews: review._id } });
    } catch (pullErr) {
      console.warn('Nu am putut actualiza câmpul reviews la stergere:', pullErr.message);
    }

    await Review.findByIdAndDelete(reviewId);
    res.json({ message: 'Recenzie ștearsă' });
  } catch (e) {
    console.error('Eroare deleteReview:', e);
    res.status(500).json({ error: 'Eroare server la ștergere recenzie' });
  }
};

module.exports = { createReview, getReviewsForUser, toggleLike, updateReview, deleteReview };


