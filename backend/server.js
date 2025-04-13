const express = require('express');
const app = express();
const PORT = 5000;

// Definirea unei rute pentru rădăcina ("/")
app.get('/', (req, res) => {
  res.send('Bun venit pe serverul Hobbiz!'); // Trimite un răspuns simplu
});

// Pornire server
app.listen(PORT, () => {
  console.log(`Server rulează pe http://localhost:${PORT}`);
});