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
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '7d' }
    );    // Redirecționează către frontend cu tokenul în query string
    res.redirect(`https://hobbiz.netlify.app/oauth-success?token=${token}`);
  }
);

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('https://hobbiz.netlify.app');
  });
});

module.exports = router;


/*
// Inițiază autentificarea cu Facebook
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

// Callback după autentificare Facebook
router.get('/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login',
    session: true,
  }),
  (req, res) => {
    // Generează JWT pentru utilizatorul autentificat
    const user = req.user;
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      process.env.JWT_SECRET || 'jwt_secret',
      { expiresIn: '7d' }
    );
    // Redirecționează către frontend cu tokenul în query string
    res.redirect(`https://hobbiz.netlify.app/oauth-success?token=${token}`);
  }
); */