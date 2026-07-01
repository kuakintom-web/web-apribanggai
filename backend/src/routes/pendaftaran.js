const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { schemas, validate } = require('../utils/validation');
const { generateRegistrationNumber } = require('../utils/crypto');
const logger = require('../utils/logger');

// Get all pendaftaran (with filters)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, desa_id, kecamatan_id, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    const conditions = [];

    let query = `
      SELECT p.id, p.registration_number, p.groom_name, p.bride_name, 
             p.marriage_date, p.status, d.name as desa_name, k.name as kecamatan_name,
             p.submitted_at, p.created_at
      FROM pendaftaran_pernikahan p
      JOIN desa d ON p.desa_id = d.id
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE 1=1
    `;

    // Scope restriction
    if (req.user.role === 'admin_kecamatan') {
      conditions.push(`k.id = $${params.length + 1}`);
      params.push(req.user.kecamatan_id);
    } else if (req.user.role === 'admin_desa') {
      conditions.push(`d.id = $${params.length + 1}`);
      params.push(req.user.desa_id);
    }

    if (status) {
      conditions.push(`p.status = $${params.length + 1}`);
      params.push(status);
    }

    if (desa_id) {
      conditions.push(`p.desa_id = $${params.length + 1}`);
      params.push(desa_id);
    }

    if (kecamatan_id && req.user.role === 'admin_kabupaten') {
      conditions.push(`k.id = $${params.length + 1}`);
      params.push(kecamatan_id);
    }

    if (search) {
      conditions.push(`(p.groom_name ILIKE $${params.length + 1} OR p.bride_name ILIKE $${params.length + 1} OR p.registration_number ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ` ORDER BY p.submitted_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM pendaftaran_pernikahan p JOIN desa d ON p.desa_id = d.id JOIN kecamatan k ON d.kecamatan_id = k.id WHERE 1=1';
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
    logger.error('Get pendaftaran error:', error);
    next(error);
  }
});

// Get pendaftaran by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, d.name as desa_name, k.name as kecamatan_name, u.full_name as registered_by_name
       FROM pendaftaran_pernikahan p
       JOIN desa d ON p.desa_id = d.id
       JOIN kecamatan k ON d.kecamatan_id = k.id
       LEFT JOIN users u ON p.registered_by = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = result.rows[0];

    // Check scope
    if (req.user.role === 'admin_kecamatan' && pendaftaran.kecamatan_id !== req.user.kecamatan_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.user.role === 'admin_desa' && pendaftaran.desa_id !== req.user.desa_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(pendaftaran);
  } catch (error) {
    logger.error('Get pendaftaran by id error:', error);
    next(error);
  }
});

// Create pendaftaran (admin desa)
router.post('/', authenticate, authorize(['admin_desa', 'admin_kecamatan', 'admin_kabupaten']), upload.fields([
  { name: 'ktp_groom', maxCount: 1 },
  { name: 'ktp_bride', maxCount: 1 },
  { name: 'bukti_domisili', maxCount: 1 },
  { name: 'surat_izin_orang_tua', maxCount: 1 },
]), async (req, res, next) => {
  try {
    const data = validate(schemas.createPendaftaran, req.body);

    // Check if desa_id matches user's desa_id for admin_desa
    if (req.user.role === 'admin_desa' && data.desa_id !== req.user.desa_id) {
      return res.status(403).json({ error: 'Anda hanya dapat input pendaftaran di desa Anda' });
    }

    const registrationNumber = generateRegistrationNumber();

    const result = await pool.query(
      `INSERT INTO pendaftaran_pernikahan (
        registration_number, groom_name, groom_birthdate, groom_birthplace, groom_ktp, groom_address, groom_religion,
        bride_name, bride_birthdate, bride_birthplace, bride_ktp, bride_address, bride_religion,
        marriage_date, marriage_location, witness1_name, witness2_name,
        desa_id, registered_by, ktp_groom, ktp_bride, bukti_domisili, surat_izin_orang_tua, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING id, registration_number, groom_name, bride_name, marriage_date, status, created_at`,
      [
        registrationNumber, data.groom_name, data.groom_birthdate, data.groom_birthplace, data.groom_ktp, data.groom_address, data.groom_religion,
        data.bride_name, data.bride_birthdate, data.bride_birthplace, data.bride_ktp, data.bride_address, data.bride_religion,
        data.marriage_date, data.marriage_location, data.witness1_name, data.witness2_name,
        data.desa_id, req.user.id,
        req.files?.ktp_groom ? `/uploads/${req.user.id}/${req.files.ktp_groom[0].filename}` : null,
        req.files?.ktp_bride ? `/uploads/${req.user.id}/${req.files.ktp_bride[0].filename}` : null,
        req.files?.bukti_domisili ? `/uploads/${req.user.id}/${req.files.bukti_domisili[0].filename}` : null,
        req.files?.surat_izin_orang_tua ? `/uploads/${req.user.id}/${req.files.surat_izin_orang_tua[0].filename}` : null,
        'pending'
      ]
    );

    const pendaftaran = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE_PENDAFTARAN', 'pendaftaran_pernikahan', pendaftaran.id, JSON.stringify(pendaftaran), 'success']
    );

    res.status(201).json({
      message: 'Pendaftaran berhasil dibuat',
      pendaftaran,
    });
  } catch (error) {
    logger.error('Create pendaftaran error:', error);
    next(error);
  }
});

// Update pendaftaran (admin desa - draft only)
router.put('/:id', authenticate, authorize(['admin_desa']), upload.fields([
  { name: 'ktp_groom', maxCount: 1 },
  { name: 'ktp_bride', maxCount: 1 },
  { name: 'bukti_domisili', maxCount: 1 },
  { name: 'surat_izin_orang_tua', maxCount: 1 },
]), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { groom_name, bride_name, marriage_date, marriage_location, witness1_name, witness2_name } = req.body;

    // Check if pendaftaran exists and belongs to user's desa
    const checkResult = await pool.query(
      'SELECT desa_id, status FROM pendaftaran_pernikahan WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = checkResult.rows[0];

    if (pendaftaran.desa_id !== req.user.desa_id) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke pendaftaran ini' });
    }

    if (pendaftaran.status !== 'pending' && pendaftaran.status !== 'draft') {
      return res.status(400).json({ error: 'Hanya pendaftaran draft yang dapat diupdate' });
    }

    const result = await pool.query(
      `UPDATE pendaftaran_pernikahan SET
       groom_name = COALESCE($1, groom_name),
       bride_name = COALESCE($2, bride_name),
       marriage_date = COALESCE($3, marriage_date),
       marriage_location = COALESCE($4, marriage_location),
       witness1_name = COALESCE($5, witness1_name),
       witness2_name = COALESCE($6, witness2_name),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, registration_number, groom_name, bride_name, status`,
      [groom_name, bride_name, marriage_date, marriage_location, witness1_name, witness2_name, id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'UPDATE_PENDAFTARAN', 'pendaftaran_pernikahan', id, 'success']
    );

    res.json({
      message: 'Pendaftaran berhasil diupdate',
      pendaftaran: result.rows[0],
    });
  } catch (error) {
    logger.error('Update pendaftaran error:', error);
    next(error);
  }
});

// Submit pendaftaran (admin desa)
router.patch('/:id/submit', authenticate, authorize(['admin_desa']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const checkResult = await pool.query(
      'SELECT desa_id, status FROM pendaftaran_pernikahan WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = checkResult.rows[0];

    if (pendaftaran.desa_id !== req.user.desa_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (pendaftaran.status !== 'draft') {
      return res.status(400).json({ error: 'Hanya pendaftaran draft yang dapat disubmit' });
    }

    const result = await pool.query(
      'UPDATE pendaftaran_pernikahan SET status = $1, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, submitted_at',
      ['pending', id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'SUBMIT_PENDAFTARAN', 'pendaftaran_pernikahan', id, 'success']
    );

    res.json({
      message: 'Pendaftaran berhasil disubmit',
      pendaftaran: result.rows[0],
    });
  } catch (error) {
    logger.error('Submit pendaftaran error:', error);
    next(error);
  }
});

// Verify pendaftaran (admin kecamatan)
router.patch('/:id/verify', authenticate, authorize(['admin_kecamatan', 'admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const checkResult = await pool.query(
      `SELECT p.desa_id, p.status, k.id as kecamatan_id FROM pendaftaran_pernikahan p
       JOIN desa d ON p.desa_id = d.id
       JOIN kecamatan k ON d.kecamatan_id = k.id
       WHERE p.id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = checkResult.rows[0];

    if (req.user.role === 'admin_kecamatan' && pendaftaran.kecamatan_id !== req.user.kecamatan_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (pendaftaran.status !== 'pending') {
      return res.status(400).json({ error: 'Hanya pendaftaran pending yang dapat diverify' });
    }

    const result = await pool.query(
      'UPDATE pendaftaran_pernikahan SET status = $1, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, verified_at',
      ['verified', id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'VERIFY_PENDAFTARAN', 'pendaftaran_pernikahan', id, JSON.stringify({ notes }), 'success']
    );

    res.json({
      message: 'Pendaftaran berhasil diverify',
      pendaftaran: result.rows[0],
    });
  } catch (error) {
    logger.error('Verify pendaftaran error:', error);
    next(error);
  }
});

// Approve pendaftaran (admin kabupaten)
router.patch('/:id/approve', authenticate, authorize(['admin_kabupaten']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const checkResult = await pool.query(
      'SELECT status FROM pendaftaran_pernikahan WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = checkResult.rows[0];

    if (pendaftaran.status !== 'verified') {
      return res.status(400).json({ error: 'Hanya pendaftaran verified yang dapat diapprove' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update status
      const result = await client.query(
        'UPDATE pendaftaran_pernikahan SET status = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, approved_at',
        ['approved', id]
      );

      // Create blangko
      const { generateBlangkoNumber } = require('../utils/crypto');
      const blangkoNumber = generateBlangkoNumber();
      await client.query(
        'INSERT INTO blangko_model_n (registration_id, blangko_number) VALUES ($1, $2)',
        [id, blangkoNumber]
      );

      await client.query('COMMIT');

      await pool.query(
        'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.user.id, 'APPROVE_PENDAFTARAN', 'pendaftaran_pernikahan', id, JSON.stringify({ notes }), 'success']
      );

      res.json({
        message: 'Pendaftaran berhasil diapprove',
        pendaftaran: result.rows[0],
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Approve pendaftaran error:', error);
    next(error);
  }
});

// Reject pendaftaran
router.patch('/:id/reject', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Alasan penolakan harus diisi' });
    }

    const checkResult = await pool.query(
      `SELECT p.status, k.id as kecamatan_id FROM pendaftaran_pernikahan p
       JOIN desa d ON p.desa_id = d.id
       JOIN kecamatan k ON d.kecamatan_id = k.id
       WHERE p.id = $1`,
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pendaftaran tidak ditemukan' });
    }

    const pendaftaran = checkResult.rows[0];

    if (req.user.role === 'admin_kecamatan' && pendaftaran.kecamatan_id !== req.user.kecamatan_id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!['pending', 'verified'].includes(pendaftaran.status)) {
      return res.status(400).json({ error: 'Hanya pendaftaran pending/verified yang dapat ditolak' });
    }

    const result = await pool.query(
      'UPDATE pendaftaran_pernikahan SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      ['rejected', id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'REJECT_PENDAFTARAN', 'pendaftaran_pernikahan', id, JSON.stringify({ reason }), 'success']
    );

    res.json({
      message: 'Pendaftaran berhasil ditolak',
      pendaftaran: result.rows[0],
    });
  } catch (error) {
    logger.error('Reject pendaftaran error:', error);
    next(error);
  }
});

module.exports = router;
