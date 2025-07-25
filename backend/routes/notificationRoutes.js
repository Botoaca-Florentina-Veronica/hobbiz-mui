const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications/:userId - toate notificările pentru un user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require('mongoose');
    let userIdObj = userId;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObj = mongoose.Types.ObjectId(userId);
    }
    const notifications = await Notification.find({ userId: userIdObj }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
