const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize, requireScope } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { schemas, validate } = require('../utils/validation');
const logger = require('../utils/logger');

// Get all berita (public)
router.get('/', async (req, res, next) => {
  try {
    const { category, scope, kecamatan_id, page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.category, 
             b.scope, b.views, u.full_name as author, b.published_at, b.created_at
      FROM berita b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'published'
    `;
    const params = [];
    const conditions = ['b.status = \'published\''];

    if (category) {
      conditions.push(`b.category = $${params.length + 1}`);
      params.push(category);
    }

    if (scope) {
      conditions.push(`b.scope = $${params.length + 1}`);
      params.push(scope);
    }

    if (kecamatan_id && scope === 'kecamatan') {
      conditions.push(`b.kecamatan_id = $${params.length + 1}`);
      params.push(kecamatan_id);
    }

    if (search) {
      conditions.push(`(b.title ILIKE $${params.length + 1} OR b.content ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }

    query += ` AND ` + conditions.join(' AND ') + ` ORDER BY b.published_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM berita b WHERE b.status = \'published\'';
    if (conditions.length > 1) {
      const conditionsWithoutStatus = conditions.slice(1);
      if (conditionsWithoutStatus.length > 0) {
        countQuery += ' AND ' + conditionsWithoutStatus.join(' AND ');
      }
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
    logger.error('Get berita error:', error);
    next(error);
  }
});

// Get berita by slug (public)
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT b.*, u.full_name as author FROM berita b
       JOIN users u ON b.author_id = u.id
       WHERE b.slug = $1 AND b.status = 'published'`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' });
    }

    const berita = result.rows[0];

    // Increment views
    await pool.query(
      'UPDATE berita SET views = views + 1 WHERE id = $1',
      [berita.id]
    );

    res.json(berita);
  } catch (error) {
    logger.error('Get berita by slug error:', error);
    next(error);
  }
});

// Create berita (admin only)
router.post('/', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), upload.single('featured_image'), async (req, res, next) => {
  try {
    const data = validate(schemas.createBerita, req.body);

    // Check scope authorization
    if (data.scope === 'kecamatan' && !data.kecamatan_id) {
      return res.status(400).json({ error: 'kecamatan_id harus diisi untuk scope kecamatan' });
    }

    if (req.user.role === 'admin_kecamatan' && data.scope === 'kecamatan' && data.kecamatan_id !== req.user.kecamatan_id) {
      return res.status(403).json({ error: 'Anda hanya dapat membuat berita untuk kecamatan Anda' });
    }

    // Generate slug
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const result = await pool.query(
      `INSERT INTO berita (title, slug, content, excerpt, featured_image, category, author_id, scope, kecamatan_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, slug, category, scope, created_at`,
      [
        data.title,
        slug,
        data.content,
        data.excerpt || null,
        req.file ? `/uploads/${req.user.id}/${req.file.filename}` : null,
        data.category || null,
        req.user.id,
        data.scope,
        data.kecamatan_id || null,
        'draft'
      ]
    );

    const berita = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'CREATE_BERITA', 'berita', berita.id, JSON.stringify(berita), 'success']
    );

    res.status(201).json({
      message: 'Berita berhasil dibuat',
      berita,
    });
  } catch (error) {
    logger.error('Create berita error:', error);
    next(error);
  }
});

// Update berita (admin only)
router.put('/:id', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), upload.single('featured_image'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, status } = req.body;

    // Check ownership
    const checkResult = await pool.query(
      'SELECT author_id, scope, kecamatan_id FROM berita WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' });
    }

    const berita = checkResult.rows[0];

    if (req.user.role === 'admin_kecamatan' && berita.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat edit berita yang Anda buat' });
    }

    const result = await pool.query(
      `UPDATE berita SET 
       title = COALESCE($1, title),
       content = COALESCE($2, content),
       excerpt = COALESCE($3, excerpt),
       category = COALESCE($4, category),
       featured_image = COALESCE($5, featured_image),
       status = COALESCE($6, status),
       updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, title, slug, status, updated_at`,
      [title, content, excerpt, category, req.file ? `/uploads/${req.user.id}/${req.file.filename}` : null, status, id]
    );

    const updatedBerita = result.rows[0];

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, new_values, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.user.id, 'UPDATE_BERITA', 'berita', id, JSON.stringify(updatedBerita), 'success']
    );

    res.json({
      message: 'Berita berhasil diupdate',
      berita: updatedBerita,
    });
  } catch (error) {
    logger.error('Update berita error:', error);
    next(error);
  }
});

// Publish berita
router.patch('/:id/publish', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE berita SET status = $1, published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, title, status, published_at',
      ['published', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Berita tidak ditemukan' });
    }

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'PUBLISH_BERITA', 'berita', id, 'success']
    );

    res.json({
      message: 'Berita berhasil dipublikasikan',
      berita: result.rows[0],
    });
  } catch (error) {
    logger.error('Publish berita error:', error);
    next(error);
  }
});

module.exports = router;
