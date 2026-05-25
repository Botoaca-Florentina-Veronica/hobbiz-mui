// Evidenț (anonimizată) a conturilor șterse, pentru a impune un cooldown la
// re-înregistrare cu același email / telefon. NU păstrăm PII brut — doar hash-uri.
// MongoDB șterge documentele automat după 30 de zile prin TTL index.
const mongoose = require('mongoose');

const COOLDOWN_DAYS = 30;
const COOLDOWN_SECONDS = COOLDOWN_DAYS * 24 * 60 * 60;

const deletedAccountSchema = new mongoose.Schema({
  // SHA-256 al email-ului normalizat (lowercase, trim). Index pentru lookup rapid.
  emailHash: { type: String, index: true },
  // SHA-256 al telefonului normalizat. `sparse` pentru cazurile fără telefon.
  phoneHash: { type: String, index: true, sparse: true },
  // TTL: documentul se șterge automat după COOLDOWN_SECONDS de la deletedAt.
  deletedAt: { type: Date, default: Date.now, expires: COOLDOWN_SECONDS },
});

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema);
module.exports.COOLDOWN_DAYS = COOLDOWN_DAYS;
