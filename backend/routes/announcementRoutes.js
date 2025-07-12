const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// GET /api/announcements?category=CategoryName
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let filter = {};
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
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('user', 'firstName lastName email phone avatar createdAt');
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: 'Eroare server la preluarea anunțului.' });
  }
});

module.exports = router;
