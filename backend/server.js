// server.js
require('dotenv').config(); // Încarcă variabilele din .env
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); // Importă rutele pentru utilizatori

// Inițializează aplicația Express
const app = express();

// Middleware
app.use(cors()); // Permite cereri cross-origin (pentru frontend)
app.use(express.json()); // Parsează corpul cererilor JSON

// Conectare la MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectat la MongoDB'))
  .catch(err => console.error('❌ Eroare la conectarea la MongoDB:', err));

// Rute
app.use('/api/users', userRoutes); // Folosește rutele pentru utilizatori

// Ruta de bază (test)
app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
});

// Pornește serverul
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Serverul rulează pe http://localhost:${PORT}`);
});