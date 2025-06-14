const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateEmail, updatePassword, addAnnouncement, getMyAnnouncements, deleteAnnouncement, updateAnnouncement, upload } = require('../controllers/UserController');
const auth = require('../middleware/auth');

// Rute
router.post('/register', register);  // User e folosit în controller
router.post('/login', login);       // User e folosit în controller
router.get('/profile', auth, getProfile); // User e folosit în controller
router.put('/update-email', auth, updateEmail); // Noua rută pentru actualizarea email-ului
router.put('/update-password', auth, updatePassword); // Rută pentru schimbarea parolei
router.post('/my-announcements', auth, upload.single('mainImage'), addAnnouncement);
router.get('/my-announcements', auth, getMyAnnouncements);
router.delete('/my-announcements/:id', auth, deleteAnnouncement);
router.put('/my-announcements/:id', auth, upload.single('mainImage'), updateAnnouncement);

// Verifică autentificarea utilizatorului
router.get('/auth/check', auth, (req, res) => {
  res.json({ isAuthenticated: true });
});

module.exports = router;