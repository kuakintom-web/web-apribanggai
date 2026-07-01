const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all desa
router.get('/', async (req, res, next) => {
  try {
    const { kecamatan_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    let query = `
      SELECT d.id, d.name, d.code, d.penghulu_name, d.penghulu_phone, d.address,
             k.name as kecamatan_name, d.created_at
      FROM desa d
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE 1=1
    `;

    if (kecamatan_id) {
      conditions.push(`d.kecamatan_id = $${params.length + 1}`);
      params.push(kecamatan_id);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY d.name LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM desa d WHERE 1=1';
    if (conditions.length > 0) {
      countQuery += ' AND ' + conditions.join(' AND ');
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
    logger.error('Get desa error:', error);
    next(error);
  }
});

// Get desa by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.id, d.name, d.code, d.penghulu_name, d.penghulu_phone, d.address,
              k.id as kecamatan_id, k.name as kecamatan_name, d.created_at
       FROM desa d
       JOIN kecamatan k ON d.kecamatan_id = k.id
       WHERE d.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Desa tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get desa by id error:', error);
    next(error);
  }
});

// Create desa (admin only)
router.post('/', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { kecamatan_id, name, code, penghulu_name, penghulu_phone, address } = req.body;

    if (!kecamatan_id || !name) {
      return res.status(400).json({ error: 'Kecamatan dan nama desa harus diisi' });
    }

    // Verify kecamatan exists
    const kecResult = await pool.query('SELECT id FROM kecamatan WHERE id = $1', [kecamatan_id]);
    if (kecResult.rows.length === 0) {
      return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
    }

    const result = await pool.query(
      `INSERT INTO desa (kecamatan_id, name, code, penghulu_name, penghulu_phone, address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, code, penghulu_name`,
      [kecamatan_id, name, code || null, penghulu_name || null, penghulu_phone || null, address || null]
    );

    const desa = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE_DESA', 'desa', desa.id, JSON.stringify(desa), 'success']
    );

    res.status(201).json({
      message: 'Desa berhasil dibuat',
      desa,
    });
  } catch (error) {
    logger.error('Create desa error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Kode desa sudah terdaftar' });
    }
    next(error);
  }
});

// Update desa (admin only)
router.put('/:id', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, penghulu_name, penghulu_phone, address } = req.body;

    const result = await pool.query(
      `UPDATE desa SET 
       name = COALESCE($1, name),
       code = COALESCE($2, code),
       penghulu_name = COALESCE($3, penghulu_name),
       penghulu_phone = COALESCE($4, penghulu_phone),
       address = COALESCE($5, address),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, code, penghulu_name`,
      [name, code, penghulu_name, penghulu_phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Desa tidak ditemukan' });
    }

    const desa = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE_DESA', 'desa', id, JSON.stringify(desa), 'success']
    );

    res.json({
      message: 'Desa berhasil diupdate',
      desa,
    });
  } catch (error) {
    logger.error('Update desa error:', error);
    next(error);
  }
});

module.exports = router;
