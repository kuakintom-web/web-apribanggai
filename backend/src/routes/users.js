const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { schemas, validate } = require('../utils/validation');
const { hashPassword } = require('../utils/crypto');
const logger = require('../utils/logger');

// Get all users (admin only)
router.get('/', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { role, kecamatan_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, email, full_name, phone, role, kecamatan_id, desa_id, status, last_login, created_at FROM users';
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (kecamatan_id) {
      conditions.push(`kecamatan_id = $${params.length + 1}`);
      params.push(kecamatan_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM users';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await pool.query(countQuery, params);
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
    logger.error('Get users error:', error);
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // User dapat akses data diri sendiri atau admin kabupaten dapat akses semua
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin_kabupaten') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await pool.query(
      'SELECT id, email, full_name, phone, role, kecamatan_id, desa_id, status, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
});

// Create user (admin only)
router.post('/', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { email, full_name, phone, role, kecamatan_id, desa_id, password } = req.body;

    if (!email || !full_name || !password || !role) {
      return res.status(400).json({ error: 'Email, nama lengkap, password, dan role harus diisi' });
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, kecamatan_id, desa_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, email, full_name, role`,
      [email, passwordHash, full_name, phone || null, role, kecamatan_id || null, desa_id || null, 'active']
    );

    const user = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE_USER', 'user', user.id, JSON.stringify(user), 'success']
    );

    res.status(201).json({
      message: 'User berhasil dibuat',
      user,
    });
  } catch (error) {
    logger.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, status, kecamatan_id, desa_id } = req.body;

    const result = await pool.query(
      `UPDATE users SET full_name = COALESCE($1, full_name), 
       phone = COALESCE($2, phone), 
       role = COALESCE($3, role), 
       status = COALESCE($4, status),
       kecamatan_id = COALESCE($5, kecamatan_id),
       desa_id = COALESCE($6, desa_id),
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7
       RETURNING id, email, full_name, phone, role, status`,
      [full_name, phone, role, status, kecamatan_id, desa_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const user = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE_USER', 'user', user.id, JSON.stringify(user), 'success']
    );

    res.json({
      message: 'User berhasil diupdate',
      user,
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
});

// Suspend/Activate user (admin only)
router.patch('/:id/status', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const result = await pool.query(
      'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, full_name, status',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE_USER_STATUS', 'user', id, JSON.stringify({ status }), 'success']
    );

    res.json({
      message: 'Status user berhasil diubah',
      user: result.rows[0],
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    next(error);
  }
});

module.exports = router;
