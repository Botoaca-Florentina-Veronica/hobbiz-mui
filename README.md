# hobbiz-mui
 proiect-haufe
https://hobbiz.netlify.app/

---

# 🚀 **Hobbiz**  
*A MERN Stack Web App for Hobby Management & Social Connection*  

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

### **Development Tools**  
- **ESLint** + **Prettier** (Code quality)  
- **Nodemon** (Server auto-reload)  
- **Git** (Version control)  

---

## 🏗 **Project Structure**  
```markdown
hobbiz-mui/
├── frontend/               # React Application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images, fonts
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route pages (Auth, Dashboard)
│   │   ├── contexts/       # Global state
│   │   ├── services/       # API service layer
│   │   ├── App.jsx         # Main component
│   │   └── main.jsx        # Vite entry point
│   └── vite.config.js      # Build configuration
│
├── backend/                # Node.js Server
│   ├── config/             # DB connection
│   ├── controllers/        # Route handlers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, error handling
│   ├── server.js           # Server setup
│   └── .env                # Environment variables
│
└── README.md               # Project documentation
```

---

## ✨ **Key Features**  
✅ **User authentication** (JWT-based registration/login)  
✅ **Hobby tracking system** with categories  
✅ **User profile customization**  
✅ **Social features** (follow users, join groups)  
✅ **Responsive design** (Mobile-friendly UI)  

---

## 🌐 **Deployment**  
- **Frontend**: Hosted on Vercel  
- **Backend**: Deployed on Render  
- **Database**: MongoDB Atlas cluster  
- **CI/CD**: GitHub Actions  

---

## 🔗 **Useful Resources**  
- [MERN Stack Documentation](https://www.mongodb.com/mern-stack)  
- [React Official Docs](https://react.dev/)  
- [Mongoose Guide](https://mongoosejs.com/docs/guide.html)  

---
