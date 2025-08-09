// backend/server.js
require('dotenv').config();
console.log('🔍 DEBUG ENV VARS:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Importă conexiunea
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // Importă rutele de autentificare
const session = require('express-session'); // Import express-session
const passport = require('passport'); // Import passport
const mitmRoutes = require('./routes/mitmRoutes'); // Importă rutele pentru mitm
const announcementRoutes = require('./routes/announcementRoutes');
const { execFile } = require('child_process');
const Alert = require('./models/Alert');
const path = require('path');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middleware
// CORS cu whitelist flexibil pentru prod/dev și suport pentru domeniile Netlify
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://hobbiz.netlify.app',
  'https://hobbiz-mui.netlify.app',
  'https://hobbiz-mui.netlify.app',
  'https://hobbiz-mui.onrender.com',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite tool-uri server-to-server sau curl fără origin
    if (!origin) return callback(null, true);
    try {
      const hostname = new URL(origin).hostname;
      const isNetlify = /\.netlify\.app$/.test(hostname);
      if (allowedOrigins.includes(origin) || isNetlify) {
        return callback(null, true);
      }
      console.warn(`CORS blocat pentru origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    } catch (e) {
      console.warn('CORS origin parse error:', e.message);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
// Accept larger JSON bodies (for base64 images) and urlencoded payloads
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/api/notifications', notificationRoutes);

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'a_very_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Conectare la baza de date
connectDB(); // Apelează funcția exportată

// Rute
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes); // Adaugă rutele de autentificare
app.use('/api/mitm', mitmRoutes); // Adaugă rutele pentru mitm

app.use('/api/announcements', announcementRoutes); // Rute pentru anunturi publice
app.use('/api/messages', messageRoutes); // Rute pentru mesaje chat

// Servire imagini uploadate din frontend/public/uploads
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
});

// DB healthcheck endpoint
app.get('/health/db', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const rs = mongoose.connection?.readyState;
    res.json({ readyState: rs, ok: rs === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Folosește calea corectă către mitm_detector.exe și interfața de rețea "Ethernet"
  execFile('../mitm-detector.exe', ['Ethernet'], (error, stdout, stderr) => {
    if (error) {
      console.error('Eroare la rularea detectorului:', error);
      return res.status(500).json({ error: 'Eroare internă la detecție MITM' });
    }

    let alerts = [];
    try {
      alerts = JSON.parse(stdout); // dacă output-ul Rust e JSON
    } catch (e) {
      alerts = stdout.split('\n').filter(Boolean);
    }

    if (alerts.length > 0) {
      Alert.create({
        username,
        alert: alerts.join('; '),
        timestamp: new Date()
      });
      return res.status(403).json({ error: 'Sesiune suspectă: posibil atac MITM detectat!' });
    }

    // Continuă login-ul normal (aici pui logica ta de autentificare)
    res.json({ success: true });
  });
});

// Pornire server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server pe http://localhost:${PORT}`);
});

// Gestionare închidere grațioasă (opțional)
const mongoose = require('mongoose');
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏹️ Conexiune MongoDB închisă grațios');
  process.exit(0);
});