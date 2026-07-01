const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const logger = require('./utils/logger');
const dbPool = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Security
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Terlalu banyak request dari IP ini, coba lagi nanti.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/docs', express.static(path.join(__dirname, '../docs')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use(`${process.env.API_PREFIX || '/api'}/auth`, require('./routes/auth'));
app.use(`${process.env.API_PREFIX || '/api'}/users`, require('./routes/users'));
app.use(`${process.env.API_PREFIX || '/api'}/berita`, require('./routes/berita'));
app.use(`${process.env.API_PREFIX || '/api'}/pendaftaran`, require('./routes/pendaftaran'));
app.use(`${process.env.API_PREFIX || '/api'}/kecamatan`, require('./routes/kecamatan'));
app.use(`${process.env.API_PREFIX || '/api'}/desa`, require('./routes/desa'));
app.use(`${process.env.API_PREFIX || '/api'}/blangko`, require('./routes/blangko'));
app.use(`${process.env.API_PREFIX || '/api'}/dashboard`, require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  
  if (err.status === 401) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.status === 403) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await dbPool.connect();
    client.release();
    logger.info('Database connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
