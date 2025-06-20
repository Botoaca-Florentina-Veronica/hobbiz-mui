https://hobbiz.netlify.app/
---

# 🚀 **Hobbiz**  
*A MERN Stack Web App for Hobby Management & Side-hustles*  
(still in working)
---

## 📖 **Description**  
Hobbiz is a full-stack web application built with the MERN stack (MongoDB, Express, React, Node.js) that enables users to:  
- Discover and monetize personal hobbies  
- Connect with like-minded enthusiasts  
---

## 💻 **Tech Stack**  
### **Frontend**  
- **React 18** with **Vite** (Fast build tool)  
- **React Router v6** (Client-side navigation)  
- **Context API** (State management)  
- **Axios** (HTTP requests to backend)  
- **Material-UI** (Styling)  
- **React Icons** (Icon library)  

### **Backend**  
- **Node.js** (Runtime environment)  
- **Express.js** (REST API framework)  
- **MongoDB Atlas** (Cloud database)  
- **Mongoose** (ODM for MongoDB)  
- **JSON Web Tokens** (User authentication)  
- **Bcrypt.js** (Password hashing)  
- **CORS** (Cross-origin requests)  
- **Passport.js** (Authentication middleware)
- **Passport-Google-OAuth20** (Google OAuth strategy for Passport)
- **Express-Session** (Session management middleware)

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

## ✨ **Key Features**  
✅ **User authentication** (JWT-based registration/login and **Google OAuth**)  
✅ **Hobby tracking system** with categories  
✅ **User profile customization**  
✅ **Social features** (follow users, join groups)  
✅ **Responsive design** (Mobile-friendly UI)  
✅ **MITM detection** (Automatic detection of Man-in-the-Middle attacks at login)  

---

## 🌐 **Deployment**  
- **Frontend**: Hosted on Netlify 
- **Backend**: Hosted on Render
- **Database**: MongoDB Atlas cluster  
- **CI/CD**: GitHub Actions  

---

## 🚧 **Planned Features**
- Sistem de mesagerie între utilizatori
- Căutare și filtrare avansată pentru anunțuri
- Rate limiting și validare suplimentară pentru securitate
- Management dinamic al categoriilor (acum sunt hardcodate)
- Notificări push și real-time updates

---

## ✨ **Recent Updates**
- **CRUD complet pentru anunțuri**: utilizatorii pot adăuga, edita, șterge și lista propriile anunțuri 
- **Upload imagine principală anunț** cu Cloudinary
- **Editare profil**: nume, prenume, localitate, telefon 
- **Schimbare email și parolă** cu validare și feedback
- **Dark mode** și responsive design
- **Detectare MITM** la login și la cerere din setări
- **Refactorizare structură frontend**: componente și pagini separate, stiluri dedicate
- **Persistență locală pentru draft anunț** (localStorage)
- **Rute protejate cu JWT** pe backend și frontend

---

## 🔗 **Useful Resources**  
- [MERN Stack Documentation](https://www.mongodb.com/mern-stack)  
- [React Official Docs](https://react.dev/)  
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)  
- [Express](https://expressjs.com/)
- [Icons](https://www.flaticon.com/)
