const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { schemas, validate } = require('../utils/validation');
const { comparePassword, hashPassword } = require('../utils/crypto');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = validate(schemas.login, req.body);
    
    const result = await pool.query(
      'SELECT id, email, password_hash, full_name, role, kecamatan_id, desa_id FROM users WHERE email = $1 AND status = $2',
      [data.email, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(data.password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, status) VALUES ($1, $2, $3, $4)',
      [user.id, 'LOGIN', 'user', 'success']
    );

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      kecamatan_id: user.kecamatan_id,
      desa_id: user.desa_id,
    });

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
});

// Register (public)
router.post('/register', async (req, res, next) => {
  try {
    const data = validate(schemas.register, req.body);
    
    const passwordHash = await hashPassword(data.password);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role`,
      [data.email, passwordHash, data.full_name, data.phone || null, 'public', 'active']
    );

    const user = result.rows[0];

    // Log audit
    await pool.query(
      'INSERT INTO audit_log (action, entity_type, entity_id, status) VALUES ($1, $2, $3, $4)',
      ['REGISTER', 'user', user.id, 'success']
    );

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user,
    });
  } catch (error) {
    logger.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }
    next(error);
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Password lama dan password baru harus diisi' });
    }

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const isPasswordValid = await comparePassword(current_password, result.rows[0].password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password lama tidak sesuai' });
    }

    const newPasswordHash = await hashPassword(new_password);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, status) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'CHANGE_PASSWORD', 'user', 'success']
    );

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    logger.error('Change password error:', error);
    next(error);
  }
});

// Verify token
router.post('/verify', authenticate, (req, res) => {
  res.json({
    message: 'Token valid',
    user: req.user,
  });
});

module.exports = router;
