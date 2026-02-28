const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

function escapeRegexLiteral(input) {
  return String(input || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// GET /api/announcements/suggest?q=term
// Lightweight autocomplete – returns only the fields the dropdown needs.
// Uses regex on title+category only (fast, supports partial words).
// ---------------------------------------------------------------------------
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const escaped = escapeRegexLiteral(q.trim());
    const suggestions = await Announcement.find({
      archived: { $ne: true },
      $or: [
        { title: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ],
    })
      .select('_id title category location price images')
      .sort({ favoritesCount: -1, createdAt: -1 })
      .limit(8)
      .lean();

    // Only send the first image to keep the payload small
    const light = suggestions.map((a) => ({
      _id: a._id,
      title: a.title,
      category: a.category,
      location: a.location,
      price: a.price,
      image: a.images?.[0] || null,
    }));

    res.json(light);
  } catch (error) {
    console.error('Eroare la suggest:', error);
    res.status(500).json({ error: 'Eroare server la sugestii căutare' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/announcements/search?q=term
// Full search – uses MongoDB $text when possible (whole-word, relevance-scored),
// with regex fallback for partial / 1-word queries the text index might miss.
// Returns full announcement objects for the results page.
// ---------------------------------------------------------------------------
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.json([]);

    const trimmed = q.trim();

    // Try $text search first (fast, uses index, has relevance score)
    let announcements = await Announcement.find(
      { archived: { $ne: true }, $text: { $search: trimmed } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(20)
      .lean();

    // Fallback to regex if $text found nothing (handles partial words like "foto")
    if (announcements.length === 0) {
      const escaped = escapeRegexLiteral(trimmed);
      announcements = await Announcement.find({
        archived: { $ne: true },
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { location: { $regex: escaped, $options: 'i' } },
          { category: { $regex: escaped, $options: 'i' } },
        ],
      })
        .sort({ favoritesCount: -1, createdAt: -1 })
        .limit(20)
        .lean();
    }

    res.json(announcements);
  } catch (error) {
    console.error('Eroare la search:', error);
    res.status(500).json({ error: 'Eroare server la căutare anunțuri' });
  }
});

// GET /api/announcements/search-index?limit=800
// Lightweight index for client-side (fuzzy) autocomplete.
router.get('/search-index', async (req, res) => {
  try {
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Number.isFinite(limitRaw) ? limitRaw : 800, 1000);

    const announcements = await Announcement.find({ archived: { $ne: true } })
      .select('_id title category location price images createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(announcements);
  } catch (error) {
    console.error('Eroare la search-index:', error);
    res.status(500).json({ error: 'Eroare server la index căutare anunțuri' });
  }
});

// GET /api/announcements?category=CategoryName
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let filter = { archived: { $ne: true } };
    if (category) {
      // Caută insensibil la majuscule/minuscule și ignoră spațiile
      filter.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }
    console.log('Filtru categorie:', filter);
    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
    console.log('Anunturi gasite:', announcements.length);
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la filtrare anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la filtrare anunțuri' });
  }
});


// GET /api/announcements/:id - detalii anunț
// GET /api/announcements/popular?limit=10 - cele mai populare după favoritesCount
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const announcements = await Announcement.find({ archived: { $ne: true } })
      .sort({ favoritesCount: -1, createdAt: -1 })
      .limit(limit);
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la popular:', error);
    res.status(500).json({ error: 'Eroare server la anunțuri populare' });
  }
});

// GET /api/announcements/:id - detalii anunț
router.get('/:id', async (req, res) => {
  try {
    // Increment views atomically then populate user
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('user', 'firstName lastName email phone avatar createdAt');
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    res.json(announcement);
  } catch (error) {
    console.error('Eroare la incrementarea views:', error);
    res.status(500).json({ error: 'Eroare server la preluarea anunțului.' });
  }
});

// POST /api/announcements/:id/favorite - incrementează favoritesCount
router.post('/:id/favorite', async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { favoritesCount: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    res.json({ favoritesCount: updated.favoritesCount });
  } catch (error) {
    console.error('Eroare la favorite +1:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea favorite' });
  }
});

// DELETE /api/announcements/:id/favorite - decrementează favoritesCount (min 0)
router.delete('/:id/favorite', async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    const newCount = Math.max(0, (ann.favoritesCount || 0) - 1);
    ann.favoritesCount = newCount;
    await ann.save();
    res.json({ favoritesCount: ann.favoritesCount });
  } catch (error) {
    console.error('Eroare la favorite -1:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea favorite' });
  }
});

module.exports = router;
