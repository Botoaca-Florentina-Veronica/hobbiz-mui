// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    // Verifică dacă emailul există deja
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Emailul este deja înregistrat' });
    }

    // Creează noul utilizator
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();
    res.status(201).json({ message: 'Cont creat cu succes' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new Error('Email invalid');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Parolă invalidă');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};