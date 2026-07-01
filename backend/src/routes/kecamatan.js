const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all kecamatan (public)
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT id, name, code, description, created_at FROM kecamatan ORDER BY name LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM kecamatan');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get kecamatan error:', error);
    next(error);
  }
});

// Get kecamatan by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, name, code, description, created_at FROM kecamatan WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
    }

    // Get desa in this kecamatan
    const desaResult = await pool.query(
      'SELECT id, name, code, penghulu_name FROM desa WHERE kecamatan_id = $1 ORDER BY name',
      [id]
    );

    const kecamatan = result.rows[0];
    kecamatan.desa = desaResult.rows;

    res.json(kecamatan);
  } catch (error) {
    logger.error('Get kecamatan by id error:', error);
    next(error);
  }
});

// Create kecamatan (admin only)
router.post('/', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Nama dan kode kecamatan harus diisi' });
    }

    const result = await pool.query(
      'INSERT INTO kecamatan (name, code, description) VALUES ($1, $2, $3) RETURNING id, name, code',
      [name, code, description || null]
    );

    const kecamatan = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE_KECAMATAN', 'kecamatan', kecamatan.id, JSON.stringify(kecamatan), 'success']
    );

    res.status(201).json({
      message: 'Kecamatan berhasil dibuat',
      kecamatan,
    });
  } catch (error) {
    logger.error('Create kecamatan error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Kode kecamatan sudah terdaftar' });
    }
    next(error);
  }
});

// Update kecamatan (admin only)
router.put('/:id', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    const result = await pool.query(
      `UPDATE kecamatan SET name = COALESCE($1, name), code = COALESCE($2, code), description = COALESCE($3, description), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, code`,
      [name, code, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
    }

    const kecamatan = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE_KECAMATAN', 'kecamatan', id, JSON.stringify(kecamatan), 'success']
    );

    res.json({
      message: 'Kecamatan berhasil diupdate',
      kecamatan,
    });
  } catch (error) {
    logger.error('Update kecamatan error:', error);
    next(error);
  }
});

module.exports = router;
