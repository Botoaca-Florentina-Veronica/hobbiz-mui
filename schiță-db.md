# 🗃️ Hobbiz Database Documentation

## 📊 Database Overview
Hobbiz uses a MongoDB database with 5 core collections

### Collections Schema

### 1. Users Collection 👥
- **Fields**:
  - `firstName` (String, required)
  - `lastName` (String, required)
  - `email` (String, required, unique)
  - `password` (String, required, hashed)
  - `phone` (String)
  - `role` (String: 'user' or 'admin')
  - `profilePicture` (String - URL)
  - `skills` (Array of Strings)
  - `bio` (String)
  - `createdAt` (Date)

### 2. Hobbies Collection 🎨
- **Fields**:
  - `name` (String, required)
  - `category` (String: 'art', 'crafts', 'tech', etc.)
  - `description` (String)
  - `difficulty` (String: 'beginner', 'intermediate', 'advanced')
  - `createdBy` (Reference to Users)
  - `tags` (Array of Strings)
  - `isMonetizable` (Boolean)
  - `createdAt` (Date)

### 3. Posts Collection 📝
- **Fields**:
  - `title` (String, required)
  - `content` (String, required)
  - `author` (Reference to Users)
  - `hobby` (Reference to Hobbies)
  - `images` (Array of URLs)
  - `likes` (Array of User references)
  - `comments` (Subdocument array)
  - `createdAt` (Date)

### 4. Groups Collection 👥
- **Fields**:
  - `name` (String, required)
  - `description` (String)
  - `members` (Array of User references)
  - `admins` (Array of User references)
  - `hobbyCategory` (String)
  - `isPrivate` (Boolean)
  - `createdAt` (Date)

### 5. Transactions Collection 💰
- **Fields**:
  - `fromUser` (Reference to Users)
  - `toUser` (Reference to Users)
  - `amount` (Number)
  - `hobby` (Reference to Hobbies)
  - `status` (String: 'pending', 'completed', 'failed')
  - `createdAt` (Date)
  - `completedAt` (Date)

## 🔗 Relationships
1. **User-to-Hobby**: One-to-Many (User can create multiple hobbies)
2. **User-to-Post**: One-to-Many (User can create multiple posts)
3. **Hobby-to-Post**: One-to-Many (Hobby can have multiple posts)
4. **User-to-Group**: Many-to-Many (User can join multiple groups)

## ⚙️ Technical Implementation
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose
- **Indexes**:
  - Unique index on `Users.email`
  - Text index on `Hobbies.name` and `Hobbies.description` for search
  - Compound index on `Posts.author` and `Posts.createdAt`

## 🔒 Security Features
- Password hashing with bcrypt.js
- Sensitive fields excluded from API responses
- Rate limiting on authentication endpoints
- All queries sanitized against NoSQL injection

## 🌱 Future Improvements
1. Add full-text search capabilities
2. Implement data aggregation for analytics
3. Add database backups scheduler
4. Introduce caching layer for frequent queries
