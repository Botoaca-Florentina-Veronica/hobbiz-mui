const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL: JWT_SECRET environment variable must be set');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        const user = await User.findById(userId);
        if (user) {
          const tokenVersion = decoded.tokenVersion || 0;
          const currentVersion = user.tokenVersion || 0;

          if (tokenVersion === currentVersion) {
            req.userId = userId;
          }
        }
      } catch (error) {
        // Token invalid - continuăm fără autentificare
      }
    }

    next();
  } catch (error) {
    next();
  }
};
