const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../config/cloudinaryMulter');
const { register, login, getProfile, updateEmail, updatePassword, addAnnouncement, getMyAnnouncements, deleteAnnouncement, updateAnnouncement, updateProfile, deleteAccount } = require('../controllers/UserController');
// Șterge contul utilizatorului și toate anunțurile sale
router.delete('/delete-account', auth, deleteAccount);

// Rute
router.post('/register', register);  // User e folosit în controller
router.post('/login', login);       // User e folosit în controller
router.get('/profile', auth, getProfile); // User e folosit în controller
router.put('/update-email', auth, updateEmail); // Noua rută pentru actualizarea email-ului
router.put('/update-password', auth, updatePassword); // Rută pentru schimbarea parolei
router.post('/my-announcements', auth, upload.array('images', 10), addAnnouncement);
router.get('/my-announcements', auth, getMyAnnouncements);
router.delete('/my-announcements/:id', auth, deleteAnnouncement);
router.put('/my-announcements/:id', auth, upload.array('images', 10), updateAnnouncement);
router.put('/profile', auth, updateProfile); // Rută pentru actualizarea profilului (nume, prenume, localitate, telefon)

// Verifică autentificarea utilizatorului
router.get('/auth/check', auth, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.userId);
    if (!user) return res.json({ isAuthenticated: false });
    // Trimite avatarul doar dacă utilizatorul are googleId (autentificat cu Google)
    res.json({
      isAuthenticated: true,
      googleAvatar: user.googleId ? user.avatar : null
    });
  } catch (e) {
    res.json({ isAuthenticated: false });
  }
});

module.exports = router;