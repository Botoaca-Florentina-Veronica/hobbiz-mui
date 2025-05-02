const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Înregistrare utilizator
exports.register = async (req, res) => {
  try { 
    const { firstName, lastName, email, password, phone } = req.body;

    // Validare date
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Verifică dacă emailul există
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Emailul este deja înregistrat' });
    }

    // Creează utilizator nou
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();
    
    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Cont creat cu succes',
      token,
      userId: user._id
    });

  } catch (error) {
    console.error('Eroare înregistrare:', error);
    res.status(500).json({ error: 'Eroare server la înregistrare' });
  }
};

// Autentificare utilizator
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validare
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parolă sunt obligatorii' });
    }

    // Găsește utilizator
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Autentificare reușită',
      token,
      userId: user._id,
      firstName: user.firstName
    });

  } catch (error) {
    console.error('Eroare autentificare:', error);
    res.status(500).json({ error: 'Eroare server la autentificare' });
  }
};

// Obține profil utilizator
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    res.json(user);
  } catch (error) {
    console.error('Eroare profil:', error);
    res.status(500).json({ error: 'Eroare server la obținerea profilului' });
  }
};