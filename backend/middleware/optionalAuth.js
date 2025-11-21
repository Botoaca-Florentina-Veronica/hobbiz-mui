const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        
        // Verifică tokenVersion pentru a invalida sesiunile vechi
        const user = await User.findById(userId);
        if (user) {
          const tokenVersion = decoded.tokenVersion || 0;
          const currentVersion = user.tokenVersion || 0;
          
          // Doar dacă tokenVersion-ul este valid, setăm userId
          if (tokenVersion === currentVersion) {
            req.userId = userId;
          } else {
            console.log('Token invalidat în optionalAuth (tokenVersion mismatch)');
          }
        }
      } catch (error) {
        // Token invalid, dar continuăm fără autentificare
        console.log('Token invalid în optionalAuth, continuăm fără autentificare');
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
