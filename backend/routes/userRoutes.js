const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const auth = require('../middleware/auth');

// Rute pentru autentificare
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rută protejată (necesită autentificare)
router.get('/profile', auth, userController.getProfile);

module.exports = router;