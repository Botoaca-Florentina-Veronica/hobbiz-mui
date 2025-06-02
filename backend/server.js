// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Importă conexiunea
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes'); // Importă rutele de autentificare
const session = require('express-session'); // Import express-session
const passport = require('passport'); // Import passport
const mitmRoutes = require('./routes/mitmRoutes'); // Importă rutele pentru mitm
const { spawn } = require('child_process');
const Alert = require('./models/Alert');

const app = express();

// Middleware
const corsOptions = {
  origin: ['https://hobbiz.netlify.app', 'http://localhost:5173'], // Domeniul frontend-ului și localhost pentru development
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metodele permise
  credentials: true, // Permite trimiterea cookie-urilor
};
app.use(cors(corsOptions));
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Rulează MitmDetector.dll (C# compilat)
  const mitm = spawn('dotnet', ['MitmDetector.dll']); // sau 'MitmDetector.exe' dacă ai compilat ca exe
  let output = '';
  mitm.stdout.on('data', (data) => {
    output += data.toString();
  });
  mitm.stderr.on('data', (data) => {
    console.error('MITM detector error:', data.toString());
  });
  mitm.on('close', async (code) => {
    let alerts = [];
    try {
      alerts = output.split('\n').filter(line => line.includes('anomaly') || line.includes('Duplicate IP'));
    } catch (e) {
      alerts = [];
    }
    if (alerts.length > 0) {
      await Alert.create({
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
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⏹️ Conexiune MongoDB închisă grațios');
  process.exit(0);
});