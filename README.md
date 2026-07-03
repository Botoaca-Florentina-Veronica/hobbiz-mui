<div align="center">

<a href="https://hobbiz.ro" target="_blank"><img src="./frontend/src/assets/images/puzzle.png" height="70" alt="Hobbiz" /></a>

# Hobbiz
www.hobbiz.ro
Gestionare hobby‑uri, skill‑uri și servicii locale. Web (React + MUI) + API Node/Express + aplicație mobilă Expo/React Native

<a href="https://play.google.com/store/apps/details?id=com.verabotoaca.hobbiz" target="_blank"><img src="https://img.shields.io/badge/Google_Play-Descarcă_aplicația-3DDC84?style=for-the-badge&logo=googleplay&logoColor=white" alt="Disponibil pe Google Play" /></a>
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
  <a href="https://nodejs.org" target="_blank"><img src="https://img.shields.io/badge/Node.js-22-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" /></a>
  <a href="https://expressjs.com" target="_blank"><img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" /></a>
  <a href="https://www.mongodb.com" target="_blank"><img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" /></a>
  <a href="https://expo.dev" target="_blank"><img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://reactnative.dev" target="_blank"><img src="https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native" /></a>
  <a href="https://socket.io" target="_blank"><img src="https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" /></a>
</div>

<br clear="all" />

---

## 📱 Aplicația Mobilă

**📲 Publicată oficial pe [Google Play](https://play.google.com/store/apps/details?id=com.verabotoaca.hobbiz)** (`com.verabotoaca.hobbiz`), după parcurgerea procesului de review Google.

Hobbiz oferă o experiență mobilă nativă completă dezvoltată cu **Expo** și **React Native**, optimizată pentru iOS și Android. Aplicația permite utilizatorilor să:

- **Exploreze anunțuri** – Navighează prin categorii și descoperă hobby-uri și servicii locale pe care ai vrea să le soliciți
- **Gestioneze favorite** – Salvează și accesezi rapid anunțurile preferate
- **Publice anunțuri** – Creează și editezi anunțuri direct de pe dispozitiv cu upload de imagini
- **Comunice în timp real** – Chat privat cu notificări push, typing indicators, editare mesaje și reacții
- **Negocieze prețul** – Oferte și contra-oferte direct în conversație, cu confirmare bilaterală
- **Rezerve sloturi orare** – Programul de disponibilitate al prestatorului, cu rezervare din chat
- **Gestioneze contul** – Profil personalizat cu avatar, dark mode, 3 limbi (RO/EN/ES) și autentificare Google OAuth (în viitor +Facebook, Apple)

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
│  │  ├─ UserService.js                      # Helper functions
│  │  └─ encryptionService.js                # AES-256-CBC encryption/decryption
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
- **Encryption**: AES-256-CBC la nivel de server (mesaje stocate criptate, decriptate la lectura)

---

## 🧪 Modele (Mongoose)
User, Announcement, Message, Notification, Review, Negotiation, Booking, Report, DeletedAccount, ContactFallbackMessage.

Elemente notabile:
- User: avatar (Cloudinary), favorites, googleId, tokenVersion (invalidare globală sesiuni), availability (program săptămânal), documente de verificare identitate.
- Announcement: imagini multiple, views, favoritesCount.
- Message: text criptat AES-256-CBC, reacții, imagine, editare (editedAt), tipuri speciale (negotiation, booking_request, collaboration_request).
- Negotiation: mașină de stare în 7 stări (pending → counter_offer → accepted → pending_confirmation → confirmed → finalized / rejected).
- Booking: rezervare slot orar din programul de disponibilitate, integrată în chat.
- Review: permis doar după colaborare confirmată, un singur review per pereche autor-utilizator.
- DeletedAccount: hash-uri SHA-256 (email/telefon) cu TTL 30 zile — cooldown anti-reînregistrare.

---

## 💬 Realtime & Chat
Socket.IO cu arhitectură room-based:
- Fiecare utilizator intră în camera proprie (`socket.join('user:' + userId)`) — mesajele țintite se emit către `io.to('user:' + id)`
- `activeConversations` (Map) urmărește conversația deschisă de fiecare utilizator, pentru marcarea automată ca citit
- Indicator typing per conversație (`conversationId` compus ownerId-otherId-announcementId)
- Evenimente: mesaje noi, editare mesaje, reacții, negocieri, rezervări, notificări, prezență online

---

## 🔐 Securitate

### Criptarea Mesajelor (AES-256-CBC)
Toate mesajele chat sunt criptate la nivel de server:
- **Encryption at Rest**: Mesajele sunt stocate criptate în MongoDB
- **Transparent**: Serverul decriptează automat mesajele la citire și trimitere în timp real (Socket.IO)
- **Unicity**: Fiecare mesaj are IV (inițializare vector) unic
- **Backward Compatibility**: Mesajele existente (decriptate) sunt accesate transparent

### Resetarea Parolei via Email + Cod
Procesul sigur de schimbare a parolei:

1. **Endpoint**: `POST /api/auth/forgot-password`
   - Utilizatorul solicită reset parolă cu email-ul
   - Server generează cod de verificare (6 cifre) + token cu TTL 15 min
   
2. **Email**: Primește email cu cod folosind **MailerSend**
   - Template: "Cod resetare parolă: XXXXXX"
   - Valid timp de 15 minute
   
3. **Verificare Cod**: `POST /api/auth/verify-reset-code`
   - Client trimite email + cod
   - Server validează și confirmă
   
4. **Setare Parolă Nouă**: `POST /api/auth/reset-password`
   - Parolă nouă + token de verificare
   - Parolă criptată cu bcryptjs (salt rounds 10)

**Limitări:**
- Rate limiting pe rutele de autentificare (20 cereri / IP / 15 min)
- Token valabil 15 minute
- Codul e stocat doar ca hash SHA-256; la reset, tokenVersion invalidează toate sesiunile active

### Pipeline anti-abuz la înregistrare
POST /api/users/register trece prin 7 porți secvențiale:
1. Rate limit strict (max 3 conturi noi / IP / oră)
2. Honeypot (câmp ascuns `_trap`)
3. Challenge token JWT (minim 2s de la afișarea formularului)
4. Câmpuri obligatorii + format email
5. Blocare domenii de email temporare (~300 domenii)
6. Cooldown 30 zile după ștergerea contului (hash-uri SHA-256 în DeletedAccount, TTL)
7. Unicitate email + telefon

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
- POST / – creare (doar după colaborare confirmată, o recenzie per utilizator)
- POST /:id/like – like/unlike
- PUT  /:id – update (autor)
- DELETE /:id – ștergere (autor)

Negotiations (/api/negotiations)
- POST / – inițiere negociere (ofertă de preț)
- POST /:id/accept | /reject | /counter-offer | /accept-counter | /buyer-counter
- POST /:id/confirm – confirmare bilaterală colaborare
- POST /:id/finalize | /cancel

Bookings & Availability (/api/bookings, /api/users/availability)
- PUT  /api/users/availability – program săptămânal de disponibilitate
- GET  /api/bookings/availability/:providerId – sloturi libere pe interval
- POST /api/bookings – cerere de rezervare (apare ca mesaj în chat)
- POST /api/bookings/:id/respond | /cancel

Admin (protejate prin middleware adminAuth)
- GET/PUT /api/users/admin/verifications/* – moderare documente identitate
- GET/PATCH/DELETE /api/reports/* – raportări de conținut
- DELETE /api/messages/conversation/:id/all – ștergere conversație (inclusiv negocierile asociate)

Health & Utilitare
- GET /api/health – stare server
- GET /health/db – stare conexiune Mongo

---

## 🧩 Tech Stack

**Frontend (Web):**
- React 19 + Vite 6
- React Router DOM 7
- Material UI 5 + Emotion
- i18next + react-i18next (RO/EN/ES)
- Axios, jwt-decode
- Socket.IO client (chat & notificări)

**Backend (API):**
- Node.js 22, Express 4
- MongoDB Atlas + Mongoose 8
- JWT (jsonwebtoken) + bcryptjs + tokenVersion (invalidare globală sesiuni)
- Passport + passport-google-oauth20 + express-session
- helmet + express-rate-limit + CORS whitelist
- Multer + Cloudinary (multer-storage-cloudinary)
- Socket.IO 4
- **MailerSend** (email tranzacțional: resetare parolă, notificări)
- **crypto** (Node.js built-in: AES-256-CBC encryption)

**Mobile (Expo):**
- Expo SDK 54, React Native 0.81 (TypeScript)
- expo-router (file-based declarative routing)
- expo-notifications + Expo Push API (notificări push)
- expo-secure-store pentru token storage
- EAS Build (build-uri native semnate, publicare Google Play)
- Linear Gradient, Safe Area context

**DevOps & Hosting:**
- **Frontend**: Netlify (auto-deploy la fiecare push)
- **Backend**: Render.com (plan Starter, instanță always-on)
- **Mobile**: EAS Build → Google Play Console
- **Database**: MongoDB Atlas (cloud)
- **Media**: Cloudinary (CDN)
- **Email**: MailerSend (email tranzacțional)
- **Staging & security**: pipeline Jenkins pe droplet DigitalOcean (Docker), cu scanare MDSSC a codului sursă și a artefactelor de build

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
- Chat real-time (Socket.IO) cu editare mesaje, reacții și imagini
- Sistem de negociere a prețului (mașină de stare, confirmare bilaterală)
- Disponibilitate prestator + rezervare sloturi orare din chat
- Notificări (in-app + push prin Expo Push API)
- Image upload (Cloudinary)
- Mobile app (Expo) — **publicată pe Google Play**
- Reviews & ratings (doar după colaborare confirmată)
- **Criptare mesaje AES-256-CBC** (encryption at rest)
- Rate limiting (express-rate-limit) & helmet (security)
- Pipeline anti-abuz la înregistrare (honeypot, challenge token, cooldown ștergere)
- Admin dashboard (verificare identitate, raportări, mesaje contact)
- Dark mode + internaționalizare (RO/EN/ES) pe web și mobil
- Pipeline Jenkins de securitate (DigitalOcean + scanare MDSSC)

**🔄 In Progress:**
- Validare request bodies (Zod/Joi)
- Teste automate (Jest + Playwright)

**📋 Future:**
- Payment processing (Stripe Connect pentru rezervări)
- Calendar de disponibilitate pe tot anul
- Publicare App Store + Sign in with Apple / Facebook Login
- Migrare backend la TypeScript
- Căutare full-text (MongoDB Atlas Search)
- Two-factor authentication (2FA)
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

