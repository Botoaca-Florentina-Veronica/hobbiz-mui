const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable must be set');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Acces neautorizat' });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Acces neautorizat' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId || decoded.id;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ error: 'Utilizator negăsit' });
    }

    const tokenVersion = decoded.tokenVersion || 0;
    const currentVersion = user.tokenVersion || 0;

    if (tokenVersion !== currentVersion) {
      return res.status(401).json({ error: 'Sesiune invalidată. Te rugăm să te autentifici din nou.' });
    }

    try {
      user.lastSeen = new Date();
      await user.save();
    } catch (updateError) {
      // Nu oprește execuția pentru această eroare
    }

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalid' });
  }
};
