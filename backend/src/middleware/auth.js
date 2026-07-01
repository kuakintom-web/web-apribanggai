const jwt = require('../utils/jwt');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  try {
    const decoded = jwt.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt:', error.message);
    return res.status(401).json({ error: 'Token tidak valid atau sudah expired' });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} (role: ${req.user.role})`);
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke resource ini' });
    }

    next();
  };
};

const requireScope = (field, userField) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userValue = req.user[userField];
    const requestValue = req.body[field] || req.params[field];

    // Admin kabupaten dapat akses semua
    if (req.user.role === 'admin_kabupaten') {
      return next();
    }

    // Scope check
    if (userValue !== requestValue) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke scope ini' });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireScope,
};
