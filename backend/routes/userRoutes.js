const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/UserController');
const auth = require('../middleware/auth');

// Rute
router.post('/register', register);  // User e folosit în controller
router.post('/login', login);       // User e folosit în controller
router.get('/profile', auth, getProfile); // User e folosit în controller

module.exports = router;