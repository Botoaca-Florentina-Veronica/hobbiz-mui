const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const Announcement = require('../models/Announcement');
const multer = require('multer');
const path = require('path');
const cloudinaryUpload = require('../config/cloudinaryMulter');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');
require('dotenv').config();

// --- CONFIGURARE MAILERSEND ---
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

// Upload avatar utilizator
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'Nicio imagine încărcată.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }
    user.avatar = req.file.path;
    await user.save();
    res.json({ message: 'Avatar actualizat cu succes!', avatar: user.avatar });
  } catch (error) {
    console.error('Eroare la upload avatar:', error);
    res.status(500).json({ error: 'Eroare server la upload avatar.' });
  }
};

// Upload cover (banner) image for profile
const uploadCover = async (req, res) => {
  try {
    const userId = req.userId;
    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'Nicio imagine încărcată.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }
    user.coverImage = req.file.path;
    await user.save();
    res.json({ message: 'Coperta a fost actualizată cu succes!', coverImage: user.coverImage });
  } catch (error) {
    console.error('Eroare la upload cover:', error);
    res.status(500).json({ error: 'Eroare server la upload cover.' });
  }
};

// Delete current avatar reference (optional: keep image in Cloudinary to avoid API complexity)
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });
    user.avatar = undefined;
    await user.save();
    res.json({ message: 'Avatar eliminat.' });
  } catch (e) {
    console.error('Eroare la ștergerea avatarului:', e);
    res.status(500).json({ error: 'Eroare server la ștergerea avatarului' });
  }
};

// Delete current cover reference
const deleteCover = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });
    user.coverImage = undefined;
    await user.save();
    res.json({ message: 'Coperta a fost ștearsă.' });
  } catch (e) {
    console.error('Eroare la ștergerea cover-ului:', e);
    res.status(500).json({ error: 'Eroare server la ștergerea cover-ului' });
  }
};

// Utilitare pentru email normalization & duplicate merge
const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const escapeRegex = (str='') => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// --- MAILERSEND EMAIL HELPER ---
async function sendPasswordResetEmail(to, code, userName = 'Utilizator') {
  if (!process.env.MAILERSEND_API_KEY || !process.env.SENDER_EMAIL) {
    console.error('[PasswordReset] MailerSend not configured (MAILERSEND_API_KEY or SENDER_EMAIL missing)');
    throw new Error('Serviciul de email nu este configurat.');
  }

  const appName = process.env.APP_NAME || 'Hobbiz';
  const sentFrom = new Sender(process.env.SENDER_EMAIL, appName);
  const recipients = [new Recipient(to, userName)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(`Codul tău de resetare - ${appName}`)
    .setHtml(
      `<h3>Codul tău de resetare este: <br><strong>${code}</strong></h3>
       <p>Expiră în 15 minute.</p>
       <p>Dacă nu ai solicitat resetarea parolei, poți ignora acest mesaj.</p>`
    )
    .setText(`Codul tău de resetare: ${code}. Expiră în 15 minute.`);

  try {
    await mailerSend.email.send(emailParams);
    console.log(`[PasswordReset] Email trimis cu succes la ${to}`);
  } catch (error) {
    console.error('[PasswordReset] MailerSend error:', error?.message || error);
    throw new Error('Nu am putut trimite emailul de resetare.');
  }
}

async function mergeDuplicateUsersByEmail(normalizedEmail) {
  if (!normalizedEmail) return null;
  try {
    // Căutăm toate conturile care diferă doar prin case
    const regex = new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i');
    const users = await User.find({ email: regex });
    if (users.length <= 1) return users[0] || null;

    // Alegem "primary" pe baza priorităților: are și googleId și password > are password > are googleId > cel mai vechi
    const score = (u) => (
      (u.googleId ? 2 : 0) + (u.password ? 3 : 0) + Math.max(0, 1 - Math.min(1, (Date.now() - u.createdAt)/86400000))
    );
    let primary = users[0];
    for (const u of users) {
      if (score(u) > score(primary)) primary = u;
    }

    // Construim set de favorite și păstrăm câmpuri lipsă (firstName/lastName/avatar) dacă primary nu le are
    const favSet = new Set();
    users.forEach(u => (u.favorites || []).forEach(f => favSet.add(f.toString())));
    primary.favorites = Array.from(favSet);

    // Completează date lipsă
    for (const u of users) {
      if (!primary.firstName && u.firstName) primary.firstName = u.firstName;
      if (!primary.lastName && u.lastName) primary.lastName = u.lastName;
      if (!primary.avatar && u.avatar) primary.avatar = u.avatar;
      if (!primary.phone && u.phone) primary.phone = u.phone;
      if (!primary.localitate && u.localitate) primary.localitate = u.localitate;
    }

    // Normalizează email-ul principal la lowercase
    primary.email = normalizeEmail(primary.email);
    await primary.save();

    // Șterge duplicatele non-primary
    const toDelete = users.filter(u => String(u._id) !== String(primary._id));
    if (toDelete.length) {
      await User.deleteMany({ _id: { $in: toDelete.map(u => u._id) } });
      console.log(`[MergeFavorites] Eliminat duplicate: ${toDelete.map(u=>u._id).join(', ')} -> primary ${primary._id}`);
    }
    return primary;
  } catch (e) {
    console.warn('[MergeFavorites] Eroare la merge duplicate:', e.message);
    return null;
  }
}

// Șterge utilizatorul și toate anunțurile sale
const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    // Șterge toate anunțurile utilizatorului
    await Announcement.deleteMany({ user: userId });
    // Șterge utilizatorul
    await User.findByIdAndDelete(userId);
    res.json({ message: 'Contul și toate anunțurile au fost șterse cu succes.' });
  } catch (error) {
    console.error('Eroare la ștergerea contului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea contului' });
  }
};

// Înregistrare utilizator
const register = async (req, res) => {
  try { 
    let { firstName, lastName, email, password, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validare date
    if (!firstName || !lastName || !normalizedEmail || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Verifică dacă emailul există
    const existingUser = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (existingUser) {
      return res.status(400).json({ error: 'Emailul este deja înregistrat' });
    }

    // Creează utilizator nou
    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      phone
    });

    await user.save();
    
    // Generează token
    const token = jwt.sign(
      { 
        userId: user._id,
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'Cont creat cu succes',
      token,
      userId: user._id
    });

  } catch (error) {
    console.error('Eroare înregistrare:', error);
    res.status(500).json({ error: 'Eroare server la înregistrare' });
  }
};

// Autentificare utilizator
const login = async (req, res) => {
  try {
  let { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

    // Validare
  if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email și parolă sunt obligatorii' });
    }

    // Găsește utilizator
  // Căutare case-insensitive
  let user = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Generează token
    const token = jwt.sign(
      { 
        userId: user._id,
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Normalizează email-ul în document dacă nu e deja (evită viitoare duplicate)
    if (user.email !== normalizedEmail) {
      user.email = normalizedEmail;
      try { await user.save(); } catch (_) {}
    }

    // Merge duplicate accounts (dacă există) -> preferăm contul curent ca primary
    const mergedPrimary = await mergeDuplicateUsersByEmail(normalizedEmail) || user;

    console.log('Token generat pentru user:', mergedPrimary._id);

    res.json({ 
      message: 'Autentificare reușită',
      token,
      userId: mergedPrimary._id,
      firstName: mergedPrimary.firstName
    });

  } catch (error) {
    console.error('Eroare autentificare:', error);
    res.status(500).json({ error: 'Eroare server la autentificare' });
  }
};

// Obține profil utilizator
const getProfile = async (req, res) => {
  try {
    // Verificăm dacă există userId în parametri (profil public) sau folosim userId din auth (profil propriu)
    const targetUserId = req.params.userId || req.userId;
    
    // Găsim utilizatorul fără parola
    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Atașăm recenziile asociate acestui utilizator (dacă modelul Review există)
    try {
      const Review = require('../models/Review');
      const reviews = await Review.find({ user: targetUserId }).sort({ createdAt: -1 }).lean();
      // Populate basic author info if possible
      const UserModel = require('../models/User');
      const authorIds = Array.from(new Set(reviews.map(r => String(r.author)).filter(Boolean)));
      let authors = {};
      if (authorIds.length) {
        const authorDocs = await UserModel.find({ _id: { $in: authorIds } }).select('firstName lastName avatar').lean();
        authorDocs.forEach(a => { authors[String(a._id)] = a; });
      }
      // Map reviews to include authorName/authorAvatar for frontend convenience
      const reviewsMapped = reviews.map(r => ({
        _id: r._id,
        score: r.score,
        comment: r.comment,
        createdAt: r.createdAt,
        author: r.author,
        authorName: r.author ? ((authors[String(r.author)]?.firstName || '') + (authors[String(r.author)]?.lastName ? (' ' + authors[String(r.author)].lastName) : '')) : undefined,
        authorAvatar: r.author ? authors[String(r.author)]?.avatar : undefined,
        likes: r.likes || [],
        likesCount: (r.likes || []).length,
        likedByCurrentUser: req.userId ? ((r.likes || []).some(id => String(id) === String(req.userId))) : false
      }));

      const userObj = user.toObject();
      userObj.reviews = reviewsMapped;
      return res.json(userObj);
    } catch (e) {
      // Dacă modelul Review nu există sau există o eroare, returnăm userul fără recenzii
      console.warn('Nu am reușit să încarc recenziile:', e.message);
      return res.json(user);
    }

  } catch (error) {
    console.error('Eroare profil:', error);
    res.status(500).json({ error: 'Eroare server la obținerea profilului' });
  }
};

// Actualizează email utilizator
const updateEmail = async (req, res) => {
  try {
    const userId = req.userId; // Obținut din middleware-ul de autentificare
    const { newEmail, password } = req.body;

    // Validare email
    if (!newEmail) {
      return res.status(400).json({ error: 'Noul email este obligatoriu' });
    }

    // Validare parolă
    if (!password) {
      return res.status(400).json({ error: 'Parola este obligatorie pentru confirmare' });
    }

    // Basic email format validation (can be more robust)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        return res.status(400).json({ error: 'Format email invalid' });
    }

    // Verifică dacă noul email există deja pentru un alt utilizator
    const existingUserWithNewEmail = await User.findOne({ email: newEmail, _id: { $ne: userId } });
    if (existingUserWithNewEmail) {
      return res.status(400).json({ error: 'Acest email este deja utilizat' });
    }

    // Găsește utilizatorul și verifică parola
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Parola este incorectă' });
    }

    user.email = newEmail;
    await user.save();

    res.json({ message: 'Email actualizat cu succes!' });

  } catch (error) {
    console.error('Eroare la actualizarea email-ului:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea email-ului' });
  }
};

// Actualizează parola utilizator
const updatePassword = async (req, res) => {
  try {
    const userId = req.userId; // Obținut din middleware-ul de autentificare
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Găsește utilizatorul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }

    // Verifică parola curentă
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Parola curentă este incorectă' });
    }

    // Setează noua parolă (va fi hash-uită automat de pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Parola a fost schimbată cu succes!' });
  } catch (error) {
    console.error('Eroare la schimbarea parolei:', error);
    res.status(500).json({ error: 'Eroare server la schimbarea parolei' });
  }
};

// Request password reset (send code to email)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Emailul este obligatoriu' });
    }

    // Do not leak if the account exists; respond with 200 either way.
    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });

    // Only proceed if user exists
    if (user) {
      // Generate a 6-digit code
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      user.passwordResetCodeHash = codeHash;
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      // Try to send email
      try {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilizator';
        await sendPasswordResetEmail(normalizedEmail, code, userName);
        console.log(`[PasswordReset] Email sent successfully to ${normalizedEmail}`);
      } catch (mailErr) {
        console.error('[PasswordReset] Email send failed:', mailErr?.message || mailErr);
        // Clear the reset code since we couldn't send the email
        user.passwordResetCodeHash = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return res.status(500).json({ error: 'Nu am putut trimite emailul de resetare. Te rugăm să încerci din nou mai târziu.' });
      }
    } else {
      // User doesn't exist, but don't reveal this fact
      console.log(`[PasswordReset] No user found for email: ${normalizedEmail}`);
    }

    // Always return the same message for security (don't leak if account exists)
    return res.json({ message: 'Dacă există un cont cu acest email, vei primi un cod de resetare.' });
  } catch (error) {
    console.error('Eroare la requestPasswordReset:', error);
    return res.status(500).json({ error: 'Eroare server la resetarea parolei' });
  }
};

// Confirm password reset (verify code and set new password)
const confirmPasswordReset = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !code || !newPassword) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpires) {
      return res.status(400).json({ error: 'Cod invalid sau expirat' });
    }

    if (new Date(user.passwordResetExpires).getTime() < Date.now()) {
      user.passwordResetCodeHash = undefined;
      user.passwordResetExpires = undefined;
      try { await user.save(); } catch (_) {}
      return res.status(400).json({ error: 'Cod invalid sau expirat' });
    }

    const incomingHash = crypto.createHash('sha256').update(String(code)).digest('hex');
    if (incomingHash !== user.passwordResetCodeHash) {
      return res.status(400).json({ error: 'Cod invalid sau expirat' });
    }

    user.password = newPassword;
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Parola a fost resetată cu succes' });
  } catch (error) {
    console.error('Eroare la confirmPasswordReset:', error);
    return res.status(500).json({ error: 'Eroare server la resetarea parolei' });
  }
};

// Adaugă un anunț nou pentru utilizatorul autentificat
const addAnnouncement = async (req, res) => {
  try {
    console.log('--- [addAnnouncement] req.body:', req.body);
    console.log('--- [addAnnouncement] req.file:', req.file);
    console.log('--- [addAnnouncement] req.userId:', req.userId);
    const userId = req.userId;
    const { title, category, description, location, contactPerson, contactEmail, contactPhone } = req.body;
    if (!title || !category || !description || !location || !contactPerson) {
      return res.status(400).json({ error: 'Toate câmpurile obligatorii trebuie completate.' });
    }
    // Salvează toate imaginile încărcate (upload multiplu)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => f.path);
    }
    const announcement = new Announcement({
      user: userId,
      title,
      category,
      description,
      location,
      contactPerson,
      contactEmail,
      contactPhone,
      images
    });
    await announcement.save();

    // Emit realtime event doar utilizatorului (lista lui) – în viitor se poate extinde
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementCreated', { id: announcement._id });
      }
    } catch (_) {}

    res.status(201).json({ message: 'Anunț adăugat cu succes!' });
  } catch (error) {
    console.error('Eroare la adăugare anunț:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

// Returnează toate anunțurile utilizatorului autentificat (exclude cele arhivate implicit)
const getMyAnnouncements = async (req, res) => {
  try {
    const userId = req.userId;
    const announcements = await Announcement.find({ user: userId, archived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri' });
  }
};

// Obține un singur anunț după ID (doar al utilizatorului autentificat)
const getMyAnnouncementById = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const announcement = await Announcement.findOne({ _id: id, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit' });
    }
    res.json(announcement);
  } catch (error) {
    console.error('Eroare la obținere anunț:', error);
    res.status(500).json({ error: 'Eroare server la obținere anunț' });
  }
};

// Returnează anunțurile publice pentru un utilizator specific (vizualizare publică) - exclude arhivate
const getUserAnnouncementsPublic = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Lipsește userId' });
    const announcements = await Announcement.find({ user: userId, archived: { $ne: true } }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri publice:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri publice' });
  }
};

// Șterge un anunț după id
const deleteAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const announcementId = req.params.id;
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOne({ _id: announcementId, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit sau nu îți aparține.' });
    }
    await Announcement.deleteOne({ _id: announcementId });
    // Emit realtime
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementDeleted', { id: announcementId });
      }
    } catch (_) {}

    res.json({ message: 'Anunț șters cu succes!' });
  } catch (error) {
    console.error('Eroare la ștergerea anunțului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea anunțului' });
  }
};

// Actualizează un anunț existent
const updateAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, category, description, location, contactPerson, contactEmail, contactPhone, existingImages } = req.body;
    let announcement = await Announcement.findOne({ _id: id, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit' });
    }
    // Actualizează câmpurile text
    announcement.title = title;
    announcement.category = category;
    announcement.description = description;
    announcement.location = location;
    announcement.contactPerson = contactPerson;
    announcement.contactEmail = contactEmail;
    announcement.contactPhone = contactPhone;
    
    // Gestionează imaginile
    let finalImages = [];
    
    // Adaugă imaginile existente care nu au fost șterse
    if (existingImages) {
      try {
        const parsedExisting = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
        if (Array.isArray(parsedExisting)) {
          finalImages = parsedExisting;
        }
      } catch (e) {
        console.error('Error parsing existingImages:', e);
      }
    }
    
    // Adaugă imaginile noi uploadate
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => f.path);
      finalImages = [...finalImages, ...newImages];
    }
    
    // Limitează la maxim 10 imagini
    announcement.images = finalImages.slice(0, 10);
    
    await announcement.save();
    // Emit realtime update (could be treated similar to created for list refresh)
    try {
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        const sid = activeUsers.get(String(userId));
        if (sid) io.to(sid).emit('announcementCreated', { id: announcement._id, updated: true });
      }
    } catch (_) {}
    res.json({ message: 'Anunț actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizare anunț:', error);
    res.status(500).json({ error: 'Eroare server la actualizare anunț' });
  }
};

// Actualizează profilul utilizatorului (nume, prenume, localitate, telefon)
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, localitate, phone, notificationSettings } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (localitate !== undefined) user.localitate = localitate;
    if (phone !== undefined) user.phone = phone;
    if (notificationSettings !== undefined) {
      console.log('📢 Updating notification settings:', notificationSettings);
      user.notificationSettings = notificationSettings;
    }
    await user.save();
    console.log('✓ Profile updated for user:', userId);
    res.json({ message: 'Profil actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizarea profilului:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea profilului' });
  }
};

// Arhivează un anunț (setează archived = true)
const archiveAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const announcementId = req.params.id;
    const announcement = await Announcement.findOne({ _id: announcementId, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit sau nu îți aparține.' });
    }
    announcement.archived = true;
    await announcement.save();
    res.json({ message: 'Anunț arhivat cu succes!', announcement });
  } catch (error) {
    console.error('Eroare la arhivarea anunțului:', error);
    res.status(500).json({ error: 'Eroare server la arhivarea anunțului' });
  }
};

// Returnează anunțurile arhivate ale utilizatorului
const getArchivedAnnouncements = async (req, res) => {
  try {
    const userId = req.userId;
    const announcements = await Announcement.find({ user: userId, archived: true }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri arhivate:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri arhivate' });
  }
};

// Dezarhivează un anunț (setează archived = false)
const unarchiveAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const announcementId = req.params.id;
    const announcement = await Announcement.findOne({ _id: announcementId, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit sau nu îți aparține.' });
    }
    announcement.archived = false;
    await announcement.save();
    res.json({ message: 'Anunț dezarhivat cu succes!', announcement });
  } catch (error) {
    console.error('Eroare la dezarhivarea anunțului:', error);
    res.status(500).json({ error: 'Eroare server la dezarhivarea anunțului' });
  }
};

// Setează token-ul Expo Push pentru utilizatorul autentificat
const setPushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Lipsește tokenul' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

    // Migration check: if pushToken is a string, convert to array
    if (user.pushToken && typeof user.pushToken === 'string') {
      user.pushToken = [user.pushToken];
    }
    // Ensure it is an array
    if (!Array.isArray(user.pushToken)) {
      user.pushToken = [];
    }

    // Add token if not already present
    if (!user.pushToken.includes(token)) {
      user.pushToken.push(token);
      await user.save();
    }
    res.json({ message: 'Push token salvat cu succes' });
  } catch (error) {
    console.error('Eroare la setarea push token:', error);
    res.status(500).json({ error: 'Eroare server la setarea push token' });
  }
};

// Șterge token-ul Expo Push pentru utilizatorul autentificat
const deletePushToken = async (req, res) => {
  try {
    const userId = req.userId;
    const { token } = req.body; // Optional: specific token to remove

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Utilizator negăsit' });

    if (token) {
      // Remove specific token
      if (Array.isArray(user.pushToken)) {
        user.pushToken = user.pushToken.filter(t => t !== token);
      } else if (user.pushToken === token) {
        // Legacy string case
        user.pushToken = [];
      }
    } else {
      // No token specified: clear all (legacy behavior)
      user.pushToken = [];
    }

    await user.save();
    res.json({ message: 'Push token eliminat cu succes' });
  } catch (error) {
    console.error('Eroare la ștergerea push token:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea push token' });
  }
};

module.exports = {
  deleteAccount,
  register,
  login,
  getProfile,
  updateEmail,
  updatePassword,
  requestPasswordReset,
  confirmPasswordReset,
  addAnnouncement,
  getMyAnnouncements,
  getMyAnnouncementById,
  getUserAnnouncementsPublic,
  deleteAnnouncement,
  updateAnnouncement,
  updateProfile,
  uploadAvatar,
  uploadCover,
  deleteAvatar,
  deleteCover,
  archiveAnnouncement,
  getArchivedAnnouncements,
  unarchiveAnnouncement
  ,setPushToken,
  deletePushToken
};