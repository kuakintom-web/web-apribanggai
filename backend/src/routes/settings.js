const express = require('express');
const db = require('../config/database');
const { authenticate, checkRole } = require('../middleware/auth');
const { success, error, paginated } = require('../utils/response');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get all settings (Admin only)
 */
router.get('/', authenticate, checkRole(['admin_kabupaten']), async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM settings ORDER BY key'
    );

    success(res, result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * Get setting by key
 */
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;

    const result = await db.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );

    if (result.rows.length === 0) {
      return error(res, 'Setting tidak ditemukan', 404);
    }

    success(res, result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * Update setting (Admin only)
 */
router.put('/:key', authenticate, checkRole(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const result = await db.query(
      `UPDATE settings SET 
        value = COALESCE($1, value),
        description = COALESCE($2, description),
        updated_by = $3,
        updated_at = NOW()
       WHERE key = $4
       RETURNING *`,
      [value, description, req.user.id, key]
    );

    if (result.rows.length === 0) {
      return error(res, 'Setting tidak ditemukan', 404);
    }

    logger.info(`Setting ${key} updated by ${req.user.id}`);
    success(res, result.rows[0], 'Setting berhasil diperbarui');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
