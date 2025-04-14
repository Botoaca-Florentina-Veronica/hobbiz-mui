const express = require('express');
const router = express.Router();
const User = require('../models/user');

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email deja folosit.' });
    }

    const newUser = new User({ username, email, password }); // 💡 poți adăuga hash la parolă mai târziu
    await newUser.save();
    res.status(201).json({ message: 'Utilizator creat cu succes!' });
  } catch (err) {
    res.status(500).json({ message: 'Eroare la server.', error: err.message });
  }
});

module.exports = router;
