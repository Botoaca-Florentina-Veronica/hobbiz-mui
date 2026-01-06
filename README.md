<div align="center">

<a href="https://hobbiz.ro" target="_blank"><img src="./frontend/src/assets/images/puzzle.png" height="70" alt="Hobbiz" /></a>

# Hobbiz
www.hobbiz.ro
Gestionare hobby‑uri, skill‑uri și servicii locale. Web (React + MUI) + API Node/Express + aplicație mobilă Expo/React Native
</div>

---

## 🧭 Descriere

<a href="https://hobbiz.netlify.app">
  <img src="./mobile-app/assets/images/poster.png" align="right" width="380" alt="Hobbiz Poster" style="margin-left: 20px; margin-bottom: 20px;" />
</a>

Hobbiz este o platformă unde utilizatorii își pot publica anunțuri în vederea monetizarii hobby‑urilor. De ce? Pentru că în ziua de azi nu mai e de ajuns o singură sursă de venit. Aici poți îmbina utilul cu plăcutul!

Nu ai hobby-uri? Nu e problemă, aici îți poți găsi pasiunile! Te poți conecta cu oameni cu aceleași interese ca tine și să învățați împreună lucruri noi prin intermediul unei comunități vaste și prietenoase. Apoi cine știe, înveți și pe alții!

### 🛠️ Tech Stack

<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:6px;">
  <a href="https://react.dev" target="_blank"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" /></a>
  <a href="https://vitejs.dev" target="_blank"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://mui.com" target="_blank"><img src="https://img.shields.io/badge/Material_UI-5-007FFF?style=for-the-badge&logo=mui&logoColor=white" alt="Material UI" /></a>
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com" target="_blank"><img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://www.mongodb.com" target="_blank"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://expo.dev" target="_blank"><img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://reactnative.dev" target="_blank"><img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" /></a>
  <a href="https://socket.io" target="_blank"><img src="https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" /></a>
</div>

<br clear="all" />

---

## 📱 Aplicația Mobilă (în lucru)

Hobbiz oferă o experiență mobilă nativă completă dezvoltată cu **Expo** și **React Native**, optimizată pentru iOS și Android. Aplicația permite utilizatorilor să:

- **Exploreze anunțuri** – Navighează prin categorii și descoperă hobby-uri și servicii locale pe care ai vrea să le soliciți
- **Gestioneze favorite** – Salvează și accesezi rapid anunțurile preferate
- **Publice anunțuri** – Creează și editezi anunțuri direct de pe dispozitiv cu upload de imagini
- **Comunice în timp real** – Chat privat cu notificări și typing indicators
- **Gestioneze contul** – Profil personalizat cu avatar, setări și autentificare Google OAuth(în viitor +Facebook, Apple)

### Capturi de Ecran

<p align="center">
  <img src="./device-view_images/POSTERE HOBBIZ.png" alt="POSTERE HOBBIZ" width="720" style="max-width:100%;height:auto;" />
</p>

---

## 🧱 Arhitectură (Monorepo)

Proiectul este organizat ca un **monorepo** cu trei subproiecte principale:
- **Backend** (Express + Node.js): API REST + WebSocket (Socket.IO) + email
- **Frontend** (React + Vite + MUI): Web app (desktop & responsive)
- **Mobile** (Expo + React Native): Native app pentru iOS & Android

Structura:

```
hobbiz-mui/
│
├─ backend/                                  # Node.js + Express API Server
│  ├─ server.js                              # Entry point
│  ├─ config/
│  │  ├─ db.js                               # MongoDB Mongoose connection
│  │  ├─ cloudinary.js                       # Image upload (Cloudinary)
│  │  ├─ cloudinaryMulter.js                 # Multer middleware
│  │  └─ passport.js                         # OAuth (Google) + JWT strategies
│  ├─ controllers/                           # Business logic
│  │  ├─ UserController.js                   # Auth, profile, password reset
│  │  ├─ MessageController.js                # Chat messages + reactions
│  │  ├─ NotificationController.js           # User notifications
│  │  ├─ ReviewController.js                 # Recenzii & rating
│  │  └─ ...
│  ├─ models/                                # Mongoose Schemas
│  │  ├─ User.js                             # user data + avatar + favorites
│  │  ├─ Announcement.js                     # hobby postings
│  │  ├─ Message.js                          # chat messages + reactions
│  │  ├─ Notification.js                     # system notifications
│  │  ├─ Review.js                           # user reviews/ratings
│  │  └─ ...
│  ├─ routes/                                # API Endpoints
│  │  ├─ authRoutes.js                       # /auth/login, /auth/forgot-password, etc.
│  │  ├─ userRoutes.js                       # /api/users/*
│  │  ├─ messageRoutes.js                    # /api/messages/*
│  │  ├─ notificationRoutes.js               # /api/notifications/*
│  │  └─ ...
│  ├─ middleware/                            # Auth, validation
│  │  ├─ auth.js                             # JWT protection
│  │  └─ optionalAuth.js                     # Optional JWT
│  ├─ services/
│  │  └─ UserService.js                      # Helper functions
│  └─ scripts/                               # DB seeding, migrations
│
├─ frontend/                                 # React 19 + Vite Web App
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  ├─ src/
│  │  ├─ api/                                # Axios instances
│  │  ├─ assets/                             # Images, icons
│  │  ├─ components/                         # Reusable UI (buttons, cards, etc.)
│  │  ├─ context/                            # React Context (auth, theme, etc.)
│  │  ├─ pages/                              # Route pages (home, profile, etc.)
│  │  ├─ services/                           # API helpers
│  │  └─ styles/                             # CSS, theme
│  └─ public/                                # Static files
│
├─ mobile-app/                               # Expo + React Native App
│  ├─ package.json
│  ├─ app/                                   # expo-router file-based routes
│  │  ├─ _layout.tsx                         # Root layout
│  │  ├─ (tabs)/                             # Tab-based navigation
│  │  │  ├─ index.tsx                        # Explore (home)
│  │  │  ├─ chat.tsx                         # Chat tab
│  │  │  ├─ favorites.tsx                    # Favorites tab
│  │  │  ├─ sell.tsx                         # Post announcement tab
│  │  │  └─ account.tsx                      # Account/Profile tab
│  │  ├─ login.tsx                           # Auth pages
│  │  ├─ signup.tsx                          # Registration
│  │  ├─ announcement-details.tsx            # Detail view
│  │  ├─ conversation.tsx                    # Chat thread
│  │  └─ ...
│  ├─ src/
│  │  ├─ context/                            # State (auth, theme, notifications)
│  │  ├─ services/                           # API client, storage
│  │  ├─ hooks/                              # Custom React hooks
│  │  └─ utils/                              # Helper functions
│  ├─ components/                            # Mobile UI components
│  │  ├─ themed-text.tsx
│  │  ├─ themed-view.tsx
│  │  ├─ ui/                                 # Custom modals, dialogs, etc.
│  │  └─ ...
│  └─ assets/                                # Images, fonts
│
├─ device-view_images/                      # Screenshots for README
├─ scripts/                                  # Root-level utilities
├─ DATA_SAFETY_PLAYSTORE.md
├─ LICENSE
├─ README.md
└─ ...
```

**Principii Arhitecturale:**
- **Monorepo**: Frontend, Backend, Mobile în același repo pentru sincronizare ușoară
- **Separare Responsabilități**: Controllers (logic), Models (schema), Routes (endpoints)
- **expo-router**: File-based routing pentru mobile (asemănător Next.js)
- **Mongoose**: Single source of truth pentru schema datelor
- **Socket.IO**: Real-time communication (chat, notifications, active users)
- **Cloudinary**: Media storage (imagini anunțuri & avatare)

---

## 🧪 Modele (Mongoose)
User, Announcement, Message, Notification, Review, Alert.

Elemente notabile:
- User: avatar (upload Cloudinary), favorites (referințe Announcement), googleId.
- Announcement: imagini multiple, views, favoritesCount.
- Message: suport reacții + imagine (upload) + conversation scoping.
- Review: like-uri + author vs. targetUser + optional auth la creare.
- Notification: tip (ex: message, review, favorite), read/unread.

---

## 💬 Realtime & Chat
Socket.IO pentru:
- Mapare userId -> socketId (activeUsers) pentru mesaje țintite (favoritesUpdated etc.)
- Indicator typing per conversație (`conversationId` compus userId1-userId2)
- Notificări actualizare favorite / mesaje / notificări.

---

## 🔐 Resetarea Parolei via Email
Utilizatorii pot reseta parola în siguranță prin:
- Cerere de resetare parolă (endpoint `/api/auth/forgot-password`)
- Primire cod de verificare pe email (trimis via **MailerSend**)
- Setare parolă nouă cu codul primit
- **Limita gratuită**: 500 emailuri/lună (MailerSend free tier)
- Criptare parolă cu bcryptjs; tokeni de resetare cu TTL scurt

---

## 🌐 Principalele Rute REST (Backend)

Prefix general: /api

Users & Auth (/api/users & /auth)
- POST /api/users/register – înregistrare
- POST /api/users/login – login (JWT)
- GET  /api/users/profile – profil autenticat
- GET  /api/users/profile/:userId – profil public (auth opțional)
- PUT  /api/users/update-email / update-password / profile
- POST /api/users/my-announcements (imagini multiple)
- GET  /api/users/my-announcements
- PUT  /api/users/my-announcements/:id
- DELETE /api/users/my-announcements/:id
- DELETE /api/users/delete-account – șterge cont + anunțuri
- POST /api/users/avatar – upload avatar
- GET  /api/users/auth/check – status autentificare

Announcements (/api/announcements)
- GET / (filtrare opțională category)
- GET /popular?limit=10
- GET /:id (autoincrement views)
- POST/DELETE /:id/favorite (increment/decrement favoritesCount)

Favorites (/api/favorites)
- GET / – lista completă + populate
- POST /:announcementId – adaugă la favorite (sync counter)
- DELETE /:announcementId – elimină

Chat Messages (/api/messages)
- POST / (text + imagine opțională)
- DELETE /:id
- POST /:id/react – toggle/update reacție
- GET  /conversations/:userId – conversațiile utilizatorului
- GET  /between/:userId1/:userId2 – thread specific
- GET  /conversation/:conversationId – mesaje scoped
- PUT  /mark-read/:userId/:otherUserId – marchează citite între doi
- PUT  /conversation/:conversationId/mark-read – citire conversație

Notifications (/api/notifications)
- GET /:userId
- POST /
- PATCH /:id/read
- DELETE /:id

Reviews (/api/reviews)
- GET /:userId – listă recenzii pentru utilizator
- POST / (auth opțional) – creare
- POST /:id/like – like/unlike
- PUT  /:id – update (autor)
- DELETE /:id – ștergere (autor)

Health & Utilitare
- GET /api/health – stare server
- GET /health/db – stare conexiune Mongo

---

## 🧩 Tech Stack

**Frontend (Web):**
- React 19 + Vite 6
- React Router DOM 7
- Material UI 5 + Emotion
- Axios, jwt-decode
- Socket.IO client (chat & notificări)

**Backend (API):**
- Node.js 18+, Express 4
- MongoDB Atlas + Mongoose 8
- JWT (jsonwebtoken) + bcryptjs
- Passport + passport-google-oauth20 + express-session
- Multer + Cloudinary (multer-storage-cloudinary)
- Socket.IO 4
- **MailerSend** (email service: password reset, notifications)

**Mobile (Expo):**
- Expo SDK 54, React Native 0.81
- expo-router (file-based declarative routing)
- axios pentru API calls
- expo-secure-store pentru token storage
- Linear Gradient, Safe Area context

**DevOps & Hosting:**
- **Frontend**: Netlify (auto-deploy from git)
- **Backend**: Render.com (Node.js server)
- **Database**: MongoDB Atlas (cloud)
- **Media**: Cloudinary (CDN)
- **Email**: MailerSend (transactional email, 500 free/month)

**Dev Tools:**
- TypeScript (type safety)
- ESLint + Prettier
- Nodemon (backend dev server)
- expo CLI (mobile development)

---

## 🗺 Roadmap (In Progress & Next)

**✅ Completed:**
- Reset parolă via email (MailerSend) + verificare cod
- OAuth Google (Passport)
- Chat real-time (Socket.IO)
- Notificări (in-app + Socket.IO)
- Image upload (Cloudinary)
- Mobile app (Expo)
- Reviews & ratings

**🔄 In Progress:**
- Rate limiting (express-rate-limit) & helmet (security)
- Validare request bodies (Zod/Joi)
- Push Notifications (Expo Notifications)

**📋 Future:**
- Căutare full-text (MongoDB Atlas Search)
- Admin dashboard (moderare recenzii/anunțuri)
- Two-factor authentication (2FA)
- Payment processing (Stripe integration)
- Advanced analytics & statistics

---

## 📚 Resurse
- React: https://react.dev
- Mongoose: https://mongoosejs.com/docs/guide.html
- Express: https://expressjs.com
- Material UI: https://mui.com
- Socket.IO: https://socket.io/docs/v4
- Expo: https://docs.expo.dev
- Cloudinary: https://cloudinary.com/documentation
- Adobe background remover: https://www.adobe.com/express/feature/image/remove-background

---

## ⚖️ Licență
Copyright (c) 2026 Hobbiz. All rights reserved.

---

<div align="center">💡 Feedback & idei sunt binevenite!</div>

