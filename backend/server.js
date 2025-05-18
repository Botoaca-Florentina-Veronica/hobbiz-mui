// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Importă conexiunea
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
const corsOptions = {
  origin: ['https://hobbiz.netlify.app'], // Domeniul frontend-ului
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metodele permise
  credentials: true, // Permite trimiterea cookie-urilor
};
app.use(cors(corsOptions));
app.use(express.json());

// Conectare la baza de date
connectDB(); // Apelează funcția exportată

// Rute
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
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