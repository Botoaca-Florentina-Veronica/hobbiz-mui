# 🗃️ Hobbiz Database Documentation

## 📊 Database Overview
Hobbiz uses a MongoDB database with **2 implemented collections** currently. The application is in development phase and additional collections are planned for future implementation.

### Collections Schema (Currently Implemented)

### 1. Users Collection 👥
- **Fields**:
  - `firstName` (String, optional)
  - `lastName` (String, optional)
  - `email` (String, required, unique)
  - `password` (String, optional - not required for Google OAuth users)
  - `phone` (String, optional)
  - `googleId` (String, unique, sparse - for Google OAuth authentication)
  - `avatar` (String - URL for profile picture)
  - `createdAt` (Date, default: Date.now)

- **Authentication Methods**:
  - Traditional email/password registration and login
  - Google OAuth 2.0 integration
  - Password hashing with bcrypt.js (10 rounds)

### 2. Alert Collection 🚨
- **Fields**:
  - `username` (String)
  - `alert` (String - alert message)
  - `timestamp` (Date, default: Date.now)

- **Purpose**: 
  - Stores MITM (Man-in-the-Middle) security alerts
  - Part of the integrated security monitoring system

---

## 🚧 Planned Collections (Future Implementation)

### 3. Announcements/Posts Collection 📝 *(Planned)*
- **Purpose**: Store user announcements for hobby-related services
- **Fields** *(Planned)*:
  - `title` (String, required)
  - `description` (String, required)
  - `category` (String - from predefined categories)
  - `author` (Reference to Users)
  - `location` (String - county/city)
  - `price` (Number, optional)
  - `images` (Array of URLs)
  - `createdAt` (Date)
  - `isActive` (Boolean)

### 4. Categories Collection 🎨 *(Planned)*
- **Purpose**: Manage hobby categories and subcategories
- **Current Implementation**: Hardcoded in frontend components
- **Categories Include**: 
  - Fotografie, Prajituri/Gătit, Muzică, Reparații, Dans, Curățenie, 
  - Grădinărit, Sport, Artă, Tehnologie, Auto, Meditații

### 5. Messages Collection 💬 *(Planned)*
- **Purpose**: User communication system
- **Fields** *(Planned)*:
  - `fromUser` (Reference to Users)
  - `toUser` (Reference to Users)
  - `content` (String)
  - `timestamp` (Date)
  - `isRead` (Boolean)

## 🔗 Current Relationships
1. **User-to-Alert**: One-to-Many (User can trigger multiple security alerts)
2. **Google OAuth Integration**: Users can authenticate via Google with automatic account linking

## 🔗 Planned Relationships *(Future)*
1. **User-to-Announcement**: One-to-Many (User can create multiple announcements)
2. **User-to-Message**: One-to-Many (User can send/receive multiple messages)
3. **Category-to-Announcement**: One-to-Many (Category can have multiple announcements)

## ⚙️ Technical Implementation
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose
- **Current Indexes**:
  - Unique index on `Users.email`
  - Unique sparse index on `Users.googleId`
- **Planned Indexes**:
  - Text index on `Announcements.title` and `Announcements.description` for search
  - Compound index on `Announcements.category` and `Announcements.createdAt`
  - Geospatial index on `Announcements.location` for location-based search

## 🔒 Security Features
- **Implemented**:
  - Password hashing with bcrypt.js (10 rounds)
  - Google OAuth 2.0 integration with Passport.js
  - JWT token authentication (24h expiry for login, 7d for OAuth)
  - CORS protection with specific origin whitelisting
  - Express session management for OAuth
  - MITM detection and alerting system
  - Sensitive fields excluded from API responses (password field)

- **Planned**:
  - Rate limiting on authentication endpoints
  - Input sanitization against NoSQL injection
  - File upload validation for images
  - User role-based access control

## 🌐 Current API Endpoints
### Authentication Routes (`/auth`)
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Handle OAuth callback
- `GET /auth/logout` - User logout

### User Routes (`/api/users`)
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/update-email` - Update user email (protected)
- `PUT /api/users/update-password` - Update password (protected)
- `GET /api/users/auth/check` - Check authentication status (protected)

### MITM Routes (`/api/mitm`)
- Currently implemented but empty - detection is automatic

## 🏗️ Application Architecture
- **Frontend**: React 18 + Vite (deployed on Netlify)
- **Backend**: Node.js + Express.js (deployed on Render)
- **Database**: MongoDB Atlas
- **Authentication**: Passport.js + JWT
- **Security**: Integrated MITM detection executable

## 🌱 Future Improvements
1. **Database Enhancements**:
   - Implement Announcements collection with full CRUD operations
   - Add Categories management system
   - Implement user messaging system
   - Add full-text search capabilities
   - Implement data aggregation for analytics

2. **Security Enhancements**:
   - Add rate limiting middleware
   - Implement input validation and sanitization
   - Add image upload security checks
   - Enhance MITM detection capabilities

3. **Performance Optimizations**:
   - Add database indexes for search optimization
   - Implement caching layer (Redis)
   - Add database backup scheduler
   - Optimize queries for better performance

4. **Feature Additions**:
   - Real-time messaging with Socket.io
   - Push notifications
   - Advanced search and filtering
   - User reviews and ratings system
   - Payment integration for transactions
