const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

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
    const { location } = req.query;

    // Optional location filter
    const locationFilter = {};
    if (location && location.trim()) {
      const escapedLoc = escapeRegexLiteral(location.trim());
      locationFilter.location = { $regex: escapedLoc, $options: 'i' };
    }

    // Try $text search first (fast, uses index, has relevance score)
    let announcements = await Announcement.find(
      { archived: { $ne: true }, ...locationFilter, $text: { $search: trimmed } },
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
        ...locationFilter,
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

// GET /api/announcements?category=CategoryName&tag=tagKey&location=Loc
// Filtrare pe categorie (exact match, case-insensitive), tag (string in array)
// și/sau locație (substring match — astfel un judet selectat acoperă și localitățile lui).
router.get('/', async (req, res) => {
  try {
    const { category, tag, location } = req.query;
    let filter = { archived: { $ne: true } };
    if (category) {
      // Caută insensibil la majuscule/minuscule (escape pe regex literals).
      filter.category = { $regex: `^${escapeRegexLiteral(category.trim())}$`, $options: 'i' };
    }
    if (tag && tag.trim()) {
      // tags este un [String] în model; egalitatea cu un string face match pe orice element din array.
      filter.tags = tag.trim();
    }
    if (location && location.trim()) {
      // Substring match: dacă userul alege judetul "Cluj", facem match și pe anunțurile
      // cu `location: "Cluj-Napoca"`. Anchored la început nu am vrut pentru că tot ce
      // începe cu termenul este suficient de relevant pentru context.
      filter.location = { $regex: escapeRegexLiteral(location.trim()), $options: 'i' };
    }
    console.log('Filtru:', filter);
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

// PUT /api/announcements/:id/archive — admin only, poate arhiva orice anunț
router.put('/:id/archive', auth, adminAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    if (announcement.archived) {
      return res.status(400).json({ error: 'Anunțul este deja arhivat.' });
    }
    announcement.archived = true;
    announcement.archivedByAdmin = true;
    announcement.archivedByAdminId = req.userId;
    await announcement.save();
    res.json({ message: 'Anunț arhivat de administrator.', announcement });
  } catch (error) {
    console.error('Eroare la arhivarea admin a anunțului:', error);
    res.status(500).json({ error: 'Eroare server la arhivarea anunțului.' });
  }
});

// PUT /api/announcements/:id/unarchive — admin only; singura cale de dezarhivare
// pentru anunțurile arhivate de un administrator
router.put('/:id/unarchive', auth, adminAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    if (!announcement.archived) {
      return res.status(400).json({ error: 'Anunțul nu este arhivat.' });
    }
    announcement.archived = false;
    announcement.archivedByAdmin = false;
    announcement.archivedByAdminId = null;
    await announcement.save();
    res.json({ message: 'Anunț dezarhivat de administrator.', announcement });
  } catch (error) {
    console.error('Eroare la dezarhivarea admin a anunțului:', error);
    res.status(500).json({ error: 'Eroare server la dezarhivarea anunțului.' });
  }
});

// DELETE /api/announcements/:id — admin only, poate șterge orice anunț
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    await Announcement.deleteOne({ _id: req.params.id });
    res.json({ message: 'Anunț șters de administrator.' });
  } catch (error) {
    console.error('Eroare la ștergerea admin a anunțului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea anunțului.' });
  }
});

module.exports = router;
