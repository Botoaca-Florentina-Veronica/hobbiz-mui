const crypto = require('crypto');

// Cheie implicită pentru dezvoltare - TREBUIE schimbată în producție prin .env
// Cheia trebuie să aibă exact 32 chars (256 biți) pentru AES-256
const DEFAULT_KEY = 'hobbiz-secret-key-32-chars-longg'; 
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
const IV_LENGTH = 16; 

const getKey = () => {
    if (ENCRYPTION_KEY.length !== 32) {
        // Dacă cheia nu are lungimea corectă, folosim fallback-ul sau o ajustăm
        if (ENCRYPTION_KEY.length > 32) return Buffer.from(ENCRYPTION_KEY.substring(0, 32));
        return Buffer.from(DEFAULT_KEY);
    }
    return Buffer.from(ENCRYPTION_KEY);
};

function encrypt(text) {
    if (!text) return text;
    // Dacă e deja "criptat" (are format specific?), nu îl mai criptăm? 
    // Nu, presupunem că intră text clar.
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        // Format: iv:content (hex)
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (err) {
        console.error("Encryption failed:", err);
        return text;
    }
}

function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = String(text).split(':');
        // Dacă formatul nu e corect (nu are IV), presupunem că e text necriptat (legacy)
        if (textParts.length < 2) return text;

        const ivHex = textParts[0];
        const encryptedHex = textParts[1];

        // Verificare simplă dacă sunt hex valid
        if (!/^[0-9a-fA-F]+$/.test(ivHex) || !/^[0-9a-fA-F]+$/.test(encryptedHex)) {
            return text;
        }

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = Buffer.from(encryptedHex, 'hex');
        
        if (iv.length !== IV_LENGTH) return text; 

        const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return decrypted.toString();
    } catch (err) {
        // Fail-safe: dacă decriptarea eșuează, returnăm textul original
        // Aceasta acoperă și cazurile în care un text simplu conține ':'
        return text;
    }
}

module.exports = { encrypt, decrypt };
