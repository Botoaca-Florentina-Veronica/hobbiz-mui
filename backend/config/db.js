const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectat la MongoDB Atlas');
  } catch (err) {
    console.error('❌ Eroare de conexiune MongoDB:', err.message);
    process.exit(1); // Închide aplicația la eroare critică
  }
};

// Evenimente de conexiune (opțional)
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose conectat la cluster');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Eroare Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose deconectat');
});

// Exportă funcția de conexiune
module.exports = connectDB;