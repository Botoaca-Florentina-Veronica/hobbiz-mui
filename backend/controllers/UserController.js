const User = require('../models/User');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const Negotiation = require('../models/Negotiation');
const Review = require('../models/Review');
const Report = require('../models/Report');
const ContactFallbackMessage = require('../models/ContactFallbackMessage');
const multer = require('multer');
const path = require('path');
const cloudinaryUpload = require('../config/cloudinaryMulter');
const cloudinary = require('../config/cloudinary');
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

// Validare simplă a formatului email-ului
const validateEmail = (email) => {
  if (!email) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

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

// Resetează datele utilizatorului, dar păstrează contul activ
const resetUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    const userIdString = String(userId);
    const userObjectId = new mongoose.Types.ObjectId(userIdString);
    const favoriteIds = Array.isArray(user.favorites) ? user.favorites.map((id) => String(id)) : [];

    // Ștergem datele generate de utilizator în platformă
    await Promise.all([
      Announcement.deleteMany({ user: userObjectId }),
      Message.deleteMany({ $or: [{ senderId: userIdString }, { destinatarId: userIdString }] }),
      Negotiation.deleteMany({ $or: [{ buyer: userObjectId }, { seller: userObjectId }] }),
      Notification.deleteMany({ $or: [{ userId: userObjectId }, { fromUserId: userObjectId }] }),
      Review.deleteMany({ $or: [{ user: userObjectId }, { author: userObjectId }] }),
      Report.deleteMany({ $or: [{ reporter: userObjectId }, { announcementOwner: userObjectId }, { resolvedBy: userObjectId }] }),
      ContactFallbackMessage.deleteMany({ $or: [{ userId: userObjectId }, { resolvedBy: userObjectId }] }),
    ]);

    // Eliminăm reacțiile (like/unlike) lăsate de utilizator la recenzii rămase
    await Review.updateMany(
      { $or: [{ likes: userObjectId }, { unlikes: userObjectId }] },
      { $pull: { likes: userObjectId, unlikes: userObjectId } }
    );

    // Ajustăm numărul de favorite pentru anunțurile care au fost favorite de acest utilizator
    if (favoriteIds.length > 0) {
      await Promise.all(
        favoriteIds.map((announcementId) =>
          Announcement.updateOne(
            { _id: announcementId },
            [
              {
                $set: {
                  favoritesCount: { $max: [{ $subtract: ['$favoritesCount', 1] }, 0] },
                },
              },
            ]
          )
        )
      );
    }

    // Reset profile/config la valori implicite (fără a șterge contul)
    user.phone = undefined;
    user.localitate = undefined;
    user.avatar = undefined;
    user.coverImage = undefined;
    user.pushToken = [];
    user.favorites = [];
    user.reviews = [];
    user.collaborations = [];
    user.balance = 0;
    user.notificationSettings = {
      email: true,
      push: true,
      messages: true,
      reviews: true,
      favorites: true,
      promotions: false,
    };
    user.documents = [];
    user.isVerified = false;
    user.verifiedAt = null;
    user.verifiedBy = null;
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.json({ message: 'Datele contului au fost resetate cu succes.' });
  } catch (error) {
    console.error('Eroare la resetarea datelor utilizatorului:', error);
    return res.status(500).json({ error: 'Eroare server la resetarea datelor utilizatorului.' });
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

    if (!validateEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Email invalid' });
    }

    // Find the user; return explicit error if not found so the client can show it
    const user = await User.findOne({ email: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') });
    if (!user) {
      return res.status(404).json({ error: 'Nu există niciun cont înregistrat cu acest email' });
    }

    // Generate a 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    user.passwordResetCodeHash = codeHash;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // If mailer isn't configured, fail explicitly so the client can show a useful message.
    try {
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Utilizator';
      await sendPasswordResetEmail(normalizedEmail, code, userName);
    } catch (mailErr) {
      console.error('[PasswordReset] Email send failed:', mailErr?.message || mailErr);
      return res.status(500).json({ error: 'Serviciul de email nu este configurat. Încearcă mai târziu.' });
    }

    return res.json({ message: 'Un cod de resetare a fost trimis la adresa ta de email.' });
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
    const { title, category, description, location, contactPerson, contactEmail, contactPhone, price } = req.body;
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
      price: price ? Number(price) : undefined,
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
    const { title, category, description, location, contactPerson, contactEmail, contactPhone, price, existingImages } = req.body;
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
    announcement.price = price ? Number(price) : undefined;
    
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

// --- VERIFICATION SYSTEM ---

// Upload document for verification (user)
const uploadVerificationDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, name, description } = req.body;

    if (!req.file || !req.file.path) {
      return res.status(400).json({ error: 'Niciun document încărcat.' });
    }

    if (!type || !name) {
      return res.status(400).json({ error: 'Tip și nume document sunt obligatorii.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    const newDocument = {
      url: req.file.path,
      publicId: req.file.filename || req.file.public_id, // Store Cloudinary public ID
      type,
      name,
      description: description || '',
      status: 'pending',
      uploadedAt: new Date()
    };

    user.documents.push(newDocument);
    await user.save();

    // Notificare pentru admini că a fost încărcat un document
    try {
      const admins = await User.find({ isAdmin: true }).select('_id');
      const documentTypeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          message: `${user.firstName || 'Utilizator'} ${user.lastName || ''} a încărcat un ${documentTypeLabel} pentru verificare.`,
          link: '/admin/setari',
          type: 'document',
          fromUserId: userId,
          actionDescription: `a încărcat un document de verificare (${documentTypeLabel}: ${name})`,
          relatedDocumentId: newDocument._id
        });
      }

      // Emit Socket.IO event pentru admini
      const io = req.app.get('io');
      const activeUsers = req.app.get('activeUsers');
      if (io && activeUsers) {
        for (const admin of admins) {
          const sid = activeUsers.get(String(admin._id));
          if (sid) {
            io.to(sid).emit('newNotification', { userId: String(admin._id) });
          }
        }
      }
    } catch (notifError) {
      console.error('Eroare la trimiterea notificării de document la admini:', notifError);
    }

    res.json({ 
      message: 'Document încărcat cu succes și trimis spre verificare.',
      document: newDocument
    });
  } catch (error) {
    console.error('Eroare la upload document:', error);
    res.status(500).json({ error: 'Eroare server la upload document.' });
  }
};

// Get user's own documents
const getUserDocuments = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('documents');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    res.json({ documents: user.documents || [] });
  } catch (error) {
    console.error('Eroare la obținerea documentelor:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

// Delete user's own document
const deleteUserDocument = async (req, res) => {
  try {
    const userId = req.userId;
    const { documentId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    const documentIndex = user.documents.findIndex(
      doc => doc._id.toString() === documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ error: 'Document negăsit.' });
    }

    const document = user.documents[documentIndex];

    // Delete from Cloudinary if publicId exists or can be extracted from URL
    let publicIdToDelete = document.publicId;
    
    // Fallback: extract publicId from URL if missing (for legacy documents)
    if (!publicIdToDelete && document.url) {
      try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v12345/hobbiz-documents/sample.jpg
        // We want: hobbiz-documents/sample
        const urlParts = document.url.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const fileName = fileNameWithExtension.split('.')[0];
        
        // Find if there's a folder (like hobbiz-documents)
        // Usually it's after 'upload/v...' or just 'upload/'
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1) {
          // Join everything after the version (v12345) until the filename
          // version is usually the part after 'upload'
          const folderParts = urlParts.slice(uploadIndex + 2, urlParts.length - 1);
          publicIdToDelete = folderParts.length > 0 
            ? `${folderParts.join('/')}/${fileName}` 
            : fileName;
        }
      } catch (err) {
        console.error('Eroare la extragerea publicId din URL:', err);
      }
    }

    if (publicIdToDelete) {
      try {
        await cloudinary.uploader.destroy(publicIdToDelete);
      } catch (cloudinaryError) {
        console.error('Eroare la eliminarea documentului din Cloudinary:', cloudinaryError);
      }
    }

    user.documents.splice(documentIndex, 1);
    await user.save();

    res.json({ message: 'Document șters cu succes.' });
  } catch (error) {
    console.error('Eroare la ștergerea documentului:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

// --- ADMIN FUNCTIONS ---

// Get all users with pending documents (admin only)
const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({
      'documents.status': 'pending'
    }).select('firstName lastName email avatar documents isVerified');

    const usersWithPendingDocs = users.map(user => ({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      isVerified: user.isVerified,
      pendingDocuments: user.documents.filter(doc => doc.status === 'pending')
    })).filter(user => user.pendingDocuments.length > 0);

    res.json({ users: usersWithPendingDocs });
  } catch (error) {
    console.error('Eroare la obținerea documentelor în așteptare:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

// Get all documents for a specific user (admin only)
const getUserDocumentsAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('firstName lastName email avatar documents isVerified verifiedAt verifiedBy');
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    res.json({ 
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt,
        documents: user.documents
      }
    });
  } catch (error) {
    console.error('Eroare la obținerea documentelor utilizatorului:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

// Verify or reject a document (admin only)
const verifyDocument = async (req, res) => {
  try {
    const adminId = req.userId;
    const { userId, documentId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status invalid. Folosește "verified" sau "rejected".' });
    }

    const admin = await User.findById(adminId).select('firstName lastName');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    const document = user.documents.id(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document negăsit.' });
    }

    const documentTypeName = document.type.charAt(0).toUpperCase() + document.type.slice(1);
    const adminName = `${admin?.firstName || 'Admin'} ${admin?.lastName || ''}`.trim();

    document.status = status;
    document.verifiedAt = new Date();
    document.verifiedBy = adminId;
    
    if (status === 'rejected' && rejectionReason) {
      document.rejectionReason = rejectionReason;
    }

    await user.save();

    // Notificare pentru utilizator despre statusul documentului
    try {
      let notificationMessage = '';
      let actionDescription = '';

      if (status === 'verified') {
        notificationMessage = `Documentul tău "${document.name}" (${documentTypeName}) a fost verificat cu succes de ${adminName}.`;
        actionDescription = `a verificat documentul tău "${document.name}"`;
      } else if (status === 'rejected') {
        const reasonText = rejectionReason ? ` Motiv: ${rejectionReason}` : '.';
        notificationMessage = `Documentul tău "${document.name}" (${documentTypeName}) a fost respins de ${adminName}.${reasonText}`;
        actionDescription = `a respins documentul tău "${document.name}"`;
      }

      if (notificationMessage) {
        await Notification.create({
          userId: user._id,
          message: notificationMessage,
          link: '/verificare-documente',
          type: 'verification',
          fromUserId: adminId,
          actionDescription: actionDescription,
          relatedDocumentId: documentId
        });

        // Emit Socket.IO event
        const io = req.app.get('io');
        const activeUsers = req.app.get('activeUsers');
        if (io && activeUsers) {
          const sid = activeUsers.get(String(user._id));
          if (sid) {
            io.to(sid).emit('newNotification', { userId: String(user._id) });
          }
        }
      }
    } catch (notifError) {
      console.error('Eroare la trimiterea notificării de document:', notifError);
    }

    res.json({ 
      message: `Document ${status === 'verified' ? 'verificat' : 'respins'} cu succes.`,
      document
    });
  } catch (error) {
    console.error('Eroare la verificarea documentului:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

// Toggle user verification badge (admin only)
const toggleUserVerification = async (req, res) => {
  try {
    const adminId = req.userId;
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: 'isVerified trebuie să fie boolean.' });
    }

    const admin = await User.findById(adminId).select('firstName lastName');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit.' });
    }

    const adminName = `${admin?.firstName || 'Admin'} ${admin?.lastName || ''}`.trim();

    user.isVerified = isVerified;
    
    if (isVerified) {
      user.verifiedAt = new Date();
      user.verifiedBy = adminId;
    } else {
      user.verifiedAt = null;
      user.verifiedBy = null;
      
      // Clear documents and remove them from Cloudinary when un-verifying user
      if (user.documents && user.documents.length > 0) {
        for (const doc of user.documents) {
          let idToDelete = doc.publicId;
          
          // Legacy fallback
          if (!idToDelete && doc.url) {
            try {
              const urlParts = doc.url.split('/');
              const fileWithExt = urlParts[urlParts.length - 1];
              const fName = fileWithExt.split('.')[0];
              const upIndex = urlParts.findIndex(p => p === 'upload');
              if (upIndex !== -1) {
                const fParts = urlParts.slice(upIndex + 2, urlParts.length - 1);
                idToDelete = fParts.length > 0 ? `${fParts.join('/')}/${fName}` : fName;
              }
            } catch (err) {}
          }

          if (idToDelete) {
            try {
              await cloudinary.uploader.destroy(idToDelete);
            } catch (err) {
              console.error(`Eroare la ștergerea documentului ${idToDelete} din Cloudinary:`, err);
            }
          }
        }
        user.documents = [];
      }
    }

    await user.save();

    // Trimite notificare utilizatorului
    if (isVerified) {
      try {
        const notificationMessage = `Felicitări! Contul tău a fost verificat de ${adminName} și ai primit badge-ul de utilizator de încredere.`;
        const link = '/profile';
        
        await Notification.create({
          userId: user._id,
          message: notificationMessage,
          link: link,
          type: 'verification',
          fromUserId: adminId,
          actionDescription: `a verificat și aprobat contul tău`
        });

        // Emit Socket.IO event for real-time notification
        const io = req.app.get('io');
        const activeUsers = req.app.get('activeUsers');
        if (io && activeUsers) {
          const sid = activeUsers.get(String(user._id));
          if (sid) {
            io.to(sid).emit('newNotification', { userId: String(user._id) });
          }
        }
      } catch (notifError) {
        console.error('Eroare la trimiterea notificării de verificare:', notifError);
      }
    }

    res.json({ 
      message: `Utilizator ${isVerified ? 'verificat' : 'neverificat'} cu succes.`,
      user: {
        _id: user._id,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt
      }
    });
  } catch (error) {
    console.error('Eroare la actualizarea verificării utilizatorului:', error);
    res.status(500).json({ error: 'Eroare server.' });
  }
};

module.exports = {
  deleteAccount,
  resetUserData,
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
  deletePushToken,
  // Verification system
  uploadVerificationDocument,
  getUserDocuments,
  deleteUserDocument,
  getPendingVerifications,
  getUserDocumentsAdmin,
  verifyDocument,
  toggleUserVerification
};