const pool = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database migrations...');
    
    // Read and execute init.sql
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    
    await client.query(initSql);
    
    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

migrate().catch((err) => {
  logger.error('Fatal error during migration:', err);
  process.exit(1);
});
