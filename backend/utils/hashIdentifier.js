const crypto = require('crypto');

// SHA-256 al unui identificator (email/telefon). Returnează hex.
// Identificatorul e normalizat înainte de hash: trim + lowercase pentru email,
// trim + doar cifre pentru telefon.
function hashEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function hashPhone(phone) {
  if (!phone || typeof phone !== 'string') return null;
  const digits = phone.replace(/\D/g, ''); // elimină tot ce nu e cifră
  if (!digits) return null;
  return crypto.createHash('sha256').update(digits).digest('hex');
}

module.exports = { hashEmail, hashPhone };
