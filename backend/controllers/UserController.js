const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { execFile } = require('child_process');
const Alert = require('../models/Alert');
const Announcement = require('../models/Announcement');
const multer = require('multer');
const path = require('path');
const cloudinaryUpload = require('../config/cloudinaryMulter');

// Înregistrare utilizator
exports.register = async (req, res) => {
  try { 
    const { firstName, lastName, email, password, phone, avatar } = req.body; // adaugă avatar

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
      phone,
      avatar: avatar || '' // setează avatar dacă există, altfel gol
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
    const user = await User.findById(req.userId).select('-password');
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
    const userId = req.userId;
    const { title, content, image } = req.body;

    // Validare date
    if (!title || !content) {
      return res.status(400).json({ error: 'Titlul și conținutul sunt obligatorii' });
    }

    // Creează anunțul
    const announcement = new Announcement({
      title,
      content,
      image,
      user: userId
    });

    await announcement.save();

    res.status(201).json({ message: 'Anunț adăugat cu succes', announcementId: announcement._id });
  } catch (error) {
    console.error('Eroare adăugare anunț:', error);
    res.status(500).json({ error: 'Eroare server la adăugarea anunțului' });
  }
};

// Obține toate anunțurile pentru utilizatorul autentificat
exports.getAnnouncements = async (req, res) => {
  try {
    const userId = req.userId;

    // Găsește anunțurile utilizatorului
    const announcements = await Announcement.find({ user: userId }).sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error('Eroare obținere anunțuri:', error);
    res.status(500).json({ error: 'Eroare server la obținerea anunțurilor' });
  }
};

// Șterge un anunț
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    // Șterge anunțul
    await Announcement.findByIdAndDelete(id);

    res.json({ message: 'Anunț șters cu succes' });
  } catch (error) {
    console.error('Eroare ștergere anunț:', error);
    res.status(500).json({ error: 'Eroare server la ștergerea anunțului' });
  }
};

// Login/Signup Google: actualizează avatarul dacă userul există deja
exports.googleLogin = async (req, res) => {
  try {
    const { email, firstName, lastName, avatar } = req.body; // primește datele de la Google
    let user = await User.findOne({ email });
    if (user) {
      // Dacă userul există, actualizează avatarul dacă nu există sau e gol
      if (!user.avatar || user.avatar === '') {
        user.avatar = avatar;
        await user.save();
      }
      // Poți actualiza și alte câmpuri dacă vrei (ex: firstName, lastName)
    } else {
      // Creează user nou cu datele de la Google
      user = new User({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: avatar || '',
      });
      await user.save();
    }
    // Generează token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Autentificare Google reușită',
      token,
      userId: user._id,
      firstName: user.firstName,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Eroare Google login:', error);
    res.status(500).json({ error: 'Eroare server la login Google' });
  }
};