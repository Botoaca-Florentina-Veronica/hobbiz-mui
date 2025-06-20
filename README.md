# 🚀 **Hobbiz**  
*A MERN Stack Web App for Hobby Management & Side-hustles*  
(still in working)
---

https://hobbiz.netlify.app/

---

## 📖 **Description**  
Hobbiz este o platformă web pentru gestionarea hobby-urilor, promovarea serviciilor și conectarea pasionaților. Oferă funcționalități de tip marketplace, anunțuri, autentificare cu email și social login, profiluri de utilizator și detecție MITM pentru securitate sporită.

## 💻 **Tech Stack**  
### **Frontend**  
- React 18 + Vite  
- React Router  
- Material UI  
- Axios  
- Netlify (deploy)

### **Backend**  
- Node.js + Express.js  
- MongoDB Atlas  
- Mongoose  
- Passport.js (Google OAuth 2.0)  
- JWT (autentificare)  
- Cloudinary (upload imagini)  
- Render (deploy)

### **Development Tools**  
- **ESLint** + **Prettier** (Code quality)  
- **Nodemon** (Server auto-reload)  
- **Git** (Version control)  

---

## 🏗 **Project Structure**  
```
hobbiz-mui
    ├──frontend/
    |   ├── public/
    |   ├── src/
    |   │   ├── assets/
    |   │   │   └── images/           # logo-uri, poze pentru categorii, etc
    |   │   ├── api/
    |   │   │   └── api.js
    |   │   ├── components/
    |   │   │   ├── CallToAction.jsx, CallToAction.css
    |   │   │   ├── Categories.jsx, Categories.css
    |   │   │   ├── Content.jsx, Content.css
    |   │   │   ├── DarkModeToggle.jsx, DarkModeToggle.css
    |   │   │   ├── Footer.jsx, Footer.css
    |   │   │   ├── Header.jsx, Header.css
    |   │   │   └── MainStage.jsx, MainStage.css
    |   │   ├── pages/
    |   │   │   ├── AccountSettings.jsx, AccountSettings.css
    |   |   |   ├── AddAnnouncementPage.jsx, AddAnnouncementPage.css 
    |   │   │   ├── EditAnnouncementPage.jsx
    |   │   │   ├── LoginPage.jsx, LoginSignup.css
    |   │   │   ├── SignupPage.jsx
    |   |   |   ├── OAuthSuccess.jsx
    |   │   │   ├── MyAnnouncements.jsx
    |   │   │   └── SocialButtons.jsx, SocialButtons.css
    |   │   ├── services/
    |   │   ├── App.jsx
    |   │   ├── App.css
    |   │   ├── index.css
    |   │   ├── main.jsx
    |   │   └── mediaQueries.css
    |   ├── vite.config.js
    |   ├── package.json
    |   └── netlify.toml
    |
    ├── backend/
    |   ├── config/
    |   │   ├── db.js
    |   │   └── passport.js           # Passport configuration for OAuth
    |   ├── controllers/
    |   │   └── UserController.js
    |   ├── middleware/
    |   │   └── auth.js
    |   ├── models/
    |   │   ├── User.js
    |   │   └── Alert.js   # <--- NEW: stores MITM alerts
    |   │   └── Announcement.js   # <--- NEW: stores user announcements
    |   ├── routes/
    |   │   ├── authRoutes.js         # Authentication routes (including Google OAuth)
    |   │   ├── mitmRoutes.js  # (now empty, detection is automatic)
    |   │   └── userRoutes.js
    |   ├── services/
    |   ├── server.js
    |   └── package.json
    ├── mitm-detector.exe   # <--- MITM detection script
    ├── README.md
    ├── schiță-db.md
    └── observatii.txt
```

---

## 🛡️ MITM Detection Integration
- Integrare automată a detecției MITM la login și endpoint dedicat pentru testare manuală.
- Alerta este salvată în colecția `Alert` dacă se detectează o sesiune suspectă.

---

## ✨ **Recent Updates**
- **CRUD complet pentru anunțuri**: utilizatorii pot adăuga, edita, șterge și lista propriile anunțuri ([backend/controllers/UserController.js](backend/controllers/UserController.js), [frontend/src/pages/AddAnnouncementPage.jsx](frontend/src/pages/AddAnnouncementPage.jsx), [frontend/src/pages/EditAnnouncementPage.jsx](frontend/src/pages/EditAnnouncementPage.jsx), [frontend/src/pages/MyAnnouncements.jsx](frontend/src/pages/MyAnnouncements.jsx))
- **Upload imagine principală anunț** cu Cloudinary
- **Editare profil**: nume, prenume, localitate, telefon ([backend/controllers/UserController.js](backend/controllers/UserController.js), [frontend/src/pages/AccountSettings.jsx](frontend/src/pages/AccountSettings.jsx))
- **Schimbare email și parolă** cu validare și feedback
- **Dark mode** și responsive design
- **Detectare MITM** la login și la cerere din setări
- **Refactorizare structură frontend**: componente și pagini separate, stiluri dedicate
- **Persistență locală pentru draft anunț** (localStorage)
- **Rute protejate cu JWT** pe backend și frontend

---

## 🚧 **Planned Features**
- Sistem de mesagerie între utilizatori
- Căutare și filtrare avansată pentru anunțuri
- Rate limiting și validare suplimentară pentru securitate
- Management dinamic al categoriilor (acum sunt hardcodate)
- Notificări push și real-time updates

---

## 🗃️ **Database**
Vezi [schiță-db.md](schiță-db.md) pentru detalii despre modele, relații și planuri de extindere.

---

## 📝 **Observații**
- Pentru deploy, vezi [observatii.txt](observatii.txt) și [netlify.toml](frontend/netlify.toml)
- Variabilele de mediu trebuie setate separat pentru frontend și backend
- Pentru debugging backend pe Render, folosește meniul de logs