const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
  });

  // Validation errors
  if (err.details) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details,
    });
  }

  // Custom errors
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Database errors
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Data sudah terdaftar' });
  }

  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Data terkait tidak ditemukan' });
  }

  // Default error
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak ditemukan',
    path: req.path,
    method: req.method,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
