const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('Token primit:', token);
    console.log('🔍 Verificare token în middleware auth:', token);
    console.log('🔍 JWT_SECRET utilizat:', process.env.JWT_SECRET);
    
    if (!token) {
      return res.status(401).json({ error: 'Acces neautorizat' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalid' });
  }
};