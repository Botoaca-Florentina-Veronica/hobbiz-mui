const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const Alert = require('../models/Alert');
const Announcement = require('../models/Announcement');
const multer = require('multer');
const path = require('path');
const cloudinaryUpload = require('../config/cloudinaryMulter');

// Șterge utilizatorul și toate anunțurile sale
exports.deleteAccount = async (req, res) => {
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
exports.register = async (req, res) => {
  try { 
    const { firstName, lastName, email, password, phone } = req.body;

    // Validare date
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii' });
    }

    // Verifică dacă emailul există
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Emailul este deja înregistrat' });
    }

    // Creează utilizator nou
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      phone
    });

    await user.save();
    
    // Generează token
    const token = jwt.sign(
      { userId: user._id },
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
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validare
    if (!email || !password) {
      return res.status(400).json({ error: 'Email și parolă sunt obligatorii' });
    }

    // Găsește utilizator
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // Verifică parola
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Date de autentificare invalide' });
    }

    // === MITM DETECTION ===
    execFile('../mitm-detector.exe', ['Ethernet'], (error, stdout, stderr) => {
      let alerts = [];
      if (error) {
        console.error('Eroare la rularea detectorului:', error);
        // Nu bloca login-ul dacă detectorul dă eroare, doar loghează
      } else {
        try {
          alerts = JSON.parse(stdout);
        } catch (e) {
          alerts = stdout.split('\n').filter(Boolean);
        }
        if (alerts.length > 0) {
          Alert.create({
            username: email,
            alert: alerts.join('; '),
            timestamp: new Date()
          });
        }
      }
    });
    // === END MITM DETECTION ===

    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generat:', token);

    res.json({ 
      message: 'Autentificare reușită',
      token,
      userId: user._id,
      firstName: user.firstName
    });

  } catch (error) {
    console.error('Eroare autentificare:', error);
    res.status(500).json({ error: 'Eroare server la autentificare' });
  }
};

// Obține profil utilizator
exports.getProfile = async (req, res) => {
  try {
    // Verificăm dacă există userId în parametri (profil public) sau folosim userId din auth (profil propriu)
    const targetUserId = req.params.userId || req.userId;
    
    const user = await User.findById(targetUserId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    res.json(user);
  } catch (error) {
    console.error('Eroare profil:', error);
    res.status(500).json({ error: 'Eroare server la obținerea profilului' });
  }
};

// Actualizează email utilizator
exports.updateEmail = async (req, res) => {
  try {
    const userId = req.userId; // Obținut din middleware-ul de autentificare
    const { newEmail } = req.body;

    // Validare email
    if (!newEmail) {
      return res.status(400).json({ error: 'Noul email este obligatoriu' });
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

    // Găsește utilizatorul și actualizează email-ul
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
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
exports.updatePassword = async (req, res) => {
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

// Adaugă un anunț nou pentru utilizatorul autentificat
exports.addAnnouncement = async (req, res) => {
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
    res.status(201).json({ message: 'Anunț adăugat cu succes!' });
  } catch (error) {
    console.error('Eroare la adăugare anunț:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

// Returnează toate anunțurile utilizatorului autentificat
exports.getMyAnnouncements = async (req, res) => {
  try {
    const userId = req.userId;
    const announcements = await Announcement.find({ user: userId }).sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Eroare la listare anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la listare anunțuri' });
  }
};

// Șterge un anunț după id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const announcementId = req.params.id;
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findOne({ _id: announcementId, user: userId });
    if (!announcement) {
      return res.status(404).json({ error: 'Anunțul nu a fost găsit sau nu îți aparține.' });
    }
    await Announcement.deleteOne({ _id: announcementId });
    res.json({ message: 'Anunț șters cu succes!' });
  } catch (error) {
    console.error('Eroare la ștergerea anunțului:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea anunțului' });
  }
};

// Actualizează un anunț existent
exports.updateAnnouncement = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { title, category, description, location, contactPerson, contactEmail, contactPhone } = req.body;
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
    // Imagini noi (upload multiplu)
    if (req.files && req.files.length > 0) {
      announcement.images = req.files.map(f => f.path);
    }
    // Dacă nu există fișiere noi, păstrează imaginile vechi
    await announcement.save();
    res.json({ message: 'Anunț actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizare anunț:', error);
    res.status(500).json({ error: 'Eroare server la actualizare anunț' });
  }
};

// Actualizează profilul utilizatorului (nume, prenume, localitate, telefon)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, localitate, phone } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilizator negăsit' });
    }
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (localitate !== undefined) user.localitate = localitate;
    if (phone !== undefined) user.phone = phone;
    await user.save();
    res.json({ message: 'Profil actualizat cu succes!' });
  } catch (error) {
    console.error('Eroare la actualizarea profilului:', error);
    res.status(500).json({ error: 'Eroare server la actualizarea profilului' });
  }
};