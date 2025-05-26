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
frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── images/           # logo-uri, poze pentru categorii, etc
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── CallToAction.jsx, CallToAction.css
│   │   │   ├── Categories.jsx, Categories.css
│   │   │   ├── Content.jsx, Content.css
│   │   │   ├── DarkModeToggle.jsx, DarkModeToggle.css
│   │   │   ├── Footer.jsx, Footer.css
│   │   │   ├── Header.jsx, Header.css
│   │   │   └── MainStage.jsx, MainStage.css
│   │   ├── pages/
│   │   │   ├── AccountSettings.jsx, AccountSettings.css
│   │   │   ├── LoginPage.jsx, SignupPage.jsx
│   │   │   ├── LoginSignup.css
│   │   │   └── SocialButtons.jsx, SocialButtons.css
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── mediaQueries.css
│   ├── vite.config.js
│   ├── package.json
│   ├── index.html
│   └── netlify.toml
backend/
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js           # Passport configuration for OAuth
│   ├── controllers/
│   │   └── UserController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication routes (including Google OAuth)
│   │   └── userRoutes.js
│   ├── services/
│   │   └── UserService.js
│   ├── server.js
│   └── package.json
├── README.md
├── schiță-db.md
└── structura.txt
```
- Toate componentele și paginile au fișiere CSS dedicate.
- Stilurile globale și pentru search-baruri/butoane sunt în `App.css`.
- Imaginile sunt în `src/assets/images/`.
- Backend-ul este organizat pe controllers, middleware, models, routes, services.

---

## ✨ **Key Features**  
✅ **User authentication** (JWT-based registration/login and **Google OAuth**)  
✅ **Hobby tracking system** with categories  
✅ **User profile customization**  
✅ **Social features** (follow users, join groups)  
✅ **Responsive design** (Mobile-friendly UI)  

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
