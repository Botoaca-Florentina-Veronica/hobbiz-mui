const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Inițiază autentificarea cu Google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback după autentificare
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true,
  }),
  (req, res) => {
    // Generează JWT pentru utilizatorul autentificat
    const user = req.user;
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '7d' }
    );
    // Redirecționează către frontend cu tokenul în query string
    res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:5173');
  });
});

module.exports = router;
