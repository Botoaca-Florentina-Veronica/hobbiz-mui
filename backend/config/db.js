const mongoose = require('mongoose');

// Never log credentials: mask the user:password segment before printing the URI.
const redactUri = (uri) => uri.replace(/\/\/([^:/?#]+):([^@/?#]+)@/, '//$1:***@');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hobbiz';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  const conn = mongoose.connection;
  console.log('✅ Conectat la MongoDB:', redactUri(uri));
  console.log('   • DB name:', conn.name, '| readyState:', conn.readyState);
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