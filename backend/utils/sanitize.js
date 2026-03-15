/**
 * sanitize.js — XSS prevention utilities for user-supplied content
 *
 * Uses the `xss` package to strip all HTML tags and dangerous payloads
 * from text stored in the database.
 */

const xss = require('xss');

// Configurare strictă: nu permitem niciun tag HTML
const xssOptions = {
  whiteList: {},           // Niciun tag permis
  stripIgnoreTag: true,    // Elimină tagurile necunoscute complet (nu le escapează)
  stripIgnoreTagBody: ['script', 'style', 'template', 'noscript'], // Elimină și conținutul lor
  css: false,              // Dezactivează parsarea atributului style
  escapeHtml: (str) => str // Returnăm textul curat fără re-escapare HTML (e deja stripped)
};

const MAX_MESSAGE_LENGTH = 2000;  // Limita maximă pentru textul unui mesaj
const MAX_EMOJI_LENGTH   = 12;    // Limita pentru un emoji (multi-char + variation selectors)

/**
 * Sanitizează un text dat de utilizator pentru stocare sigură:
 * — elimină toat`e   tagurile HTML
 * — elimină script-uri, event handlers și URL-uri javascript:
 * — respectă limita maximă de lungime
 *
 * @param {string} text - Textul brut primit de la utilizator
 * @param {number} [maxLength] - Lungimea maximă (default: MAX_MESSAGE_LENGTH)
 * @returns {string} Textul sanitizat
 */
function sanitizeText(text, maxLength = MAX_MESSAGE_LENGTH) {
  if (!text || typeof text !== 'string') return '';
  // 1. Trim și limitare lungime înainte de parsare
  const truncated = text.trim().slice(0, maxLength);
  // 2. Sanitizare xss — elimină orice HTML/JS
  return xss(truncated, xssOptions);
}

/**
 * Validează și sanitizează un emoji primit de la utilizator.
 * Respinge orice conținut care ar putea fi HTML sau JavaScript.
 *
 * @param {string} emoji - Emoji-ul brut
 * @returns {string|null} Emoji-ul curat sau null dacă este invalid
 */
function sanitizeEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return null;
  const cleaned = emoji.trim().slice(0, MAX_EMOJI_LENGTH);
  // Respinge orice care conține < > sau cuvinte cheie periculoase
  if (/<|>|&(?:#|[a-z])|javascript:|on\w+\s*=/i.test(cleaned)) return null;
  return cleaned;
}

module.exports = { sanitizeText, sanitizeEmoji, MAX_MESSAGE_LENGTH };
