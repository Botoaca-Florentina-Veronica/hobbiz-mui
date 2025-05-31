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
    |   │   │   ├── LoginPage.jsx, SignupPage.jsx
    |   │   │   ├── LoginSignup.css
    |   │   │   └── SocialButtons.jsx, SocialButtons.css
    |   │   ├── services/
    |   │   ├── App.jsx
    |   │   ├── App.css
    |   │   ├── index.css
    |   │   ├── main.jsx
    |   │   └── mediaQueries.css
    |   ├── vite.config.js
    |   ├── package.json
    |   ├── index.html
    |   └── netlify.toml
    |
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
    |   ├── routes/
    |   │   ├── authRoutes.js         # Authentication routes (including Google OAuth)
    |   │   ├── mitmRoutes.js  # (now empty, detection is automatic)
    |   │   └── userRoutes.js
    |   ├── services/
    |   │   └── UserService.js
    |   ├── server.js
    |   └── package.json
    ├── mitm_detector.exe   # <--- NEW: MITM detection script
    ├── README.md
    ├── schiță-db.md
    └──structura.txt
```

---

# 🛡️ MITM Detection Integration

What is MITM?
MITM (Man-in-the-Middle) is an attack where someone intercepts communication between two parties without their knowledge. This code detects such attacks by analyzing network traffic and the ARP table.

## How it works
- On every login attempt (`POST /login`), the backend runs the `mitm_detector.exe` script.
- If a MITM attack is detected (based on the script output), the login is blocked and an alert is saved in the MongoDB `alerts` collection.
- Alerts contain the username, the alert message, and a timestamp.
- This process is invisible to the user.


## Notes
- MITM detection is fully automated and runs in the backend only.
- All alerts are visible in the `alerts` collection in MongoDB Atlas (use Compass to view them).

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

## 🔗 **Useful Resources**  
- [MERN Stack Documentation](https://www.mongodb.com/mern-stack)  
- [React Official Docs](https://react.dev/)  
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)  
- [Express](https://expressjs.com/)
- [Icons](https://www.flaticon.com/)
