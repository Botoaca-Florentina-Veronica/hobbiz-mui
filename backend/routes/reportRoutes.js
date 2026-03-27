const express = require('express');
const mongoose = require('mongoose');

const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const User = require('../models/User');
const { sanitizeText } = require('../utils/sanitize');

const router = express.Router();

const REPORT_REASONS = new Set(['spam', 'fake', 'abusive', 'wrong_category', 'other']);

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const notifyAdminsForNewReport = async (req, reportDoc, announcementTitle) => {
  const ADMIN_ID = '6808bf9a48e492acb8db7173';
  const admins = await User.find({ $or: [{ isAdmin: true }, { _id: ADMIN_ID }] }).select('_id').lean();

  for (const admin of admins) {
    await Notification.create({
      userId: admin._id,
      message: `Raportare nouă: ${announcementTitle || 'Anunț fără titlu'}`,
      link: '/admin/setari',
      type: 'general',
      relatedAnnouncementId: String(reportDoc.announcement),
    });

    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(admin._id));
        if (sid) {
          io.to(sid).emit('newNotification', { userId: String(admin._id) });
        }
      }
    } catch (_) {}
  }
};

// User: create report
router.post('/', auth, async (req, res) => {
  try {
    const { announcementId, reason, details } = req.body || {};

    if (!announcementId || !isValidObjectId(announcementId)) {
      return res.status(400).json({ error: 'Anunț invalid.' });
    }

    const announcement = await Announcement.findById(announcementId).select('_id user title');
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit.' });
    }

    if (String(announcement.user) === String(req.userId)) {
      return res.status(400).json({ error: 'Nu poți raporta propriul anunț.' });
    }

    const cleanReason = REPORT_REASONS.has(String(reason)) ? String(reason) : 'other';
    const cleanDetails = sanitizeText(details || '', 2000);

    const existingOpen = await Report.findOne({
      announcement: announcement._id,
      reporter: req.userId,
      status: 'open',
    }).select('_id');

    if (existingOpen) {
      return res.status(409).json({ error: 'Ai deja o raportare deschisă pentru acest anunț.' });
    }

    const report = await Report.create({
      announcement: announcement._id,
      announcementOwner: announcement.user,
      reporter: req.userId,
      reason: cleanReason,
      details: cleanDetails,
    });

    await notifyAdminsForNewReport(req, report, announcement.title);

    res.status(201).json({ success: true, report });
  } catch (error) {
    console.error('[Reports] Error creating report:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut trimite raportarea.' });
  }
});

// Admin: list reports
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const status = String(req.query.status || 'open');
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    const query = status === 'all' ? {} : { status };

    const items = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('announcement', 'title category location user')
      .populate('reporter', 'firstName lastName email avatar')
      .populate('announcementOwner', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName')
      .lean();

    res.json({ items });
  } catch (error) {
    console.error('[Reports] Error listing reports:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut încărca raportările.' });
  }
});

// Admin: resolve report
router.patch('/:id/resolve', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Raportare invalidă.' });
    }

    const adminNote = sanitizeText(req.body?.adminNote || '', 1000);

    const existing = await Report.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Raportarea nu a fost găsită.' });
    }

    if (existing.status === 'resolved') {
      return res.json({ success: true, item: existing });
    }

    const item = await Report.findByIdAndUpdate(
      id,
      {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: req.userId,
        adminNote,
      },
      { new: true }
    )
      .populate('announcement', 'title category location user')
      .populate('reporter', 'firstName lastName email avatar')
      .populate('announcementOwner', 'firstName lastName email')
      .populate('resolvedBy', 'firstName lastName');

    res.json({ success: true, item });
  } catch (error) {
    console.error('[Reports] Error resolving report:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut actualiza raportarea.' });
  }
});

// Admin: delete report
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Raportare invalidă.' });
    }

    const item = await Report.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ error: 'Raportarea nu a fost găsită.' });
    }

    res.json({ success: true, id });
  } catch (error) {
    console.error('[Reports] Error deleting report:', error?.message || error);
    res.status(500).json({ error: 'Nu am putut șterge raportarea.' });
  }
});

module.exports = router;
