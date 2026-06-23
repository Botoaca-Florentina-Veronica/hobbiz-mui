// backend/server.js
require('dotenv').config();

// Validate required secrets at startup — fail fast rather than run insecurely
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is not set. Server cannot start.');
  process.exit(1);
}

// Error handling pentru uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

console.log('🔍 ENV CHECK:');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***SET***' : 'NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***SET***' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT || 5000);

const express = require('express');
const cors = require('cors');
const http = require('http');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');
const { createAdapter } = require('@socket.io/cluster-adapter');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const passport = require('passport');
const announcementRoutes = require('./routes/announcementRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const path = require('path');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const negotiationRoutes = require('./routes/negotiationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const reportRoutes = require('./routes/reportRoutes');
const shareRoutes = require('./routes/shareRoutes');

const app = express();
const server = http.createServer(app);

// Required for secure cookies when running behind Render/other reverse proxies.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({
  // Allow cross-origin resources needed for the SPA (images, fonts, etc.)
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// Utility: detect private/local hosts (LAN IPs, localhost)
function isPrivateHostname(hostname) {
  if (!hostname) return false;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
}

// Exact allowed origins — no wildcards
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://hobbiz.ro',
  'https://www.hobbiz.ro',
  'https://hobbiz.netlify.app',
  'https://hobbiz-mui.netlify.app',
  'https://hobbiz-mui.onrender.com',
  'https://hobbiz-app-kkull.ondigitalocean.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8081',
  'http://localhost:19000',
  'http://localhost:19006',
].filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return true; // server-to-server or curl
  try {
    const hostname = new URL(origin).hostname;
    return allowedOrigins.includes(origin) || isPrivateHostname(hostname);
  } catch (e) {
    return false;
  }
}

// Configure Socket.IO with CORS
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Enable cross-process event routing when running under PM2 cluster mode
io.adapter(createAdapter());

// Per-worker map used only to track which conversation each user is currently viewing
// (drives push-notification suppression; acceptable if stale across workers)
const typingUsers = new Map();
const activeConversations = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  socket.on('join', (userId) => {
    // Join a room named after the user so controllers can emit via io.to('user:<id>')
    socket.join('user:' + userId);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined with socket ${socket.id}`);
    io.emit('userStatus', { userId, status: 'online' });
  });

  socket.on('joinConversation', ({ userId, conversationId }) => {
    if (userId && conversationId) {
      activeConversations.set(userId, conversationId);
    }
  });

  socket.on('leaveConversation', ({ userId }) => {
    if (userId) {
      activeConversations.delete(userId);
    }
  });

  // fetchSockets() queries all cluster workers, so online status is accurate cross-process
  socket.on('checkStatus', async (targetUserId, callback) => {
    try {
      const sockets = await io.in('user:' + String(targetUserId)).fetchSockets();
      if (typeof callback === 'function') {
        callback({ status: sockets.length > 0 ? 'online' : 'offline' });
      }
    } catch (_) {
      if (typeof callback === 'function') callback({ status: 'offline' });
    }
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    if (!socket.userId) return;

    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Set());
    }

    const typingSet = typingUsers.get(conversationId);
    if (isTyping) typingSet.add(socket.userId);
    else typingSet.delete(socket.userId);

    const participantIds = conversationId.split('-');
    participantIds.forEach(participantId => {
      if (participantId !== socket.userId) {
        // Emitting to a user room works across all cluster workers automatically
        io.to('user:' + participantId).emit('userTyping', {
          conversationId,
          userId: socket.userId,
          isTyping,
        });
      }
    });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeConversations.delete(socket.userId);
      io.emit('userStatus', { userId: socket.userId, status: 'offline' });
      typingUsers.forEach((typingSet, conversationId) => {
        if (typingSet.has(socket.userId)) {
          typingSet.delete(socket.userId);
          const participantIds = conversationId.split('-');
          participantIds.forEach(participantId => {
            if (participantId !== socket.userId) {
              io.to('user:' + participantId).emit('userTyping', {
                conversationId,
                userId: socket.userId,
                isTyping: false,
              });
            }
          });
        }
      });
      console.log(`👤 User ${socket.userId} disconnected`);
    }
  });
});

app.set('io', io);
app.set('activeConversations', activeConversations);

// CORS
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    console.warn(`CORS blocat pentru origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting — aplicat pe toate rutele de autentificare
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 20,
  message: { error: 'Prea multe încercări. Încearcă din nou după 15 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
// Limită strictă specifică pentru creare cont: max 3 conturi noi de pe același IP / oră.
// Aplicată ÎNAINTE de limiter-ul generic (cele 2 se cumulează).
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 oră
  max: 3,
  message: { error: 'Ai depășit limita de conturi create de pe acest IP. Încearcă peste o oră.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
app.use('/auth/', authLimiter);
app.use('/api/users/login', authLimiter);
// Pe /api/users/register* aplicăm registerLimiter doar pentru POST (creare propriu-zisă),
// nu și pentru GET /register/challenge (care doar emite token-ul anti-bot).
app.use(
  '/api/users/register',
  (req, res, next) => (req.method === 'POST' ? registerLimiter(req, res, next) : next()),
  authLimiter,
);

app.use('/api/notifications', notificationRoutes);

// Session cu MongoDB store persistent
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 zi în secunde
    autoRemove: 'native',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 zi în ms
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Conectare la baza de date
connectDB();

// Rute
app.use('/api/users', userRoutes);
app.use('/auth', authRoutes);

app.use('/api/announcements', announcementRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportRoutes);

app.use('/share', shareRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

app.get('/', (req, res) => {
  res.send('🚀 Serverul rulează!');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/health/db', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const rs = mongoose.connection?.readyState;
    res.json({ readyState: rs, ok: rs === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/login', async (req, res) => {
  res.json({ success: true });
});

// Pornire server
const PORT = process.env.PORT || 5000;
try {
  const os = require('os');
  const nets = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  if (addresses.length) {
    console.log('🔍 LAN addresses:', addresses.join(', '));
  }
} catch (e) {
  // ignore
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Server pe http://0.0.0.0:${PORT} (accessible on LAN)`);
  console.log(`🔌 Socket.IO enabled for real-time chat`);
});

server.on('error', (err) => {
  console.error('💥 Server Error:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('⏹️ Conexiune MongoDB închisă grațios');
  server.close(() => {
    console.log('⏹️ Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
