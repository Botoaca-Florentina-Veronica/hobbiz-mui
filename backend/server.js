const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware pentru JSON
app.use(express.json());

// Conectare la MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectat la MongoDB'))
.catch((err) => console.error('❌ Eroare la conectare:', err));

// Rute
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Serverul rulează pe http://localhost:${PORT}`);
});
