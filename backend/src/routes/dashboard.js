const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');
const moment = require('moment');

// Get dashboard statistics (admin only)
router.get('/', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan', 'admin_desa']), async (req, res, next) => {
  try {
    const params = [];
    const conditions = [];
    let desaCondition = '';

    // Scope restriction
    if (req.user.role === 'admin_kecamatan') {
      conditions.push(`k.id = $${params.length + 1}`);
      params.push(req.user.kecamatan_id);
      desaCondition = `AND k.id = $${params.length + 1}`;
      params.push(req.user.kecamatan_id);
    } else if (req.user.role === 'admin_desa') {
      conditions.push(`d.id = $${params.length + 1}`);
      params.push(req.user.desa_id);
      desaCondition = `AND d.id = $${params.length + 1}`;
      params.push(req.user.desa_id);
    }

    // Total pendaftaran
    let query = `
      SELECT COUNT(*) as total FROM pendaftaran_pernikahan p
      JOIN desa d ON p.desa_id = d.id
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE 1=1
    `;
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    const totalResult = await pool.query(query, params);

    // Pendaftaran by status
    query = `
      SELECT p.status, COUNT(*) as count FROM pendaftaran_pernikahan p
      JOIN desa d ON p.desa_id = d.id
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE 1=1
    `;
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    query += ' GROUP BY p.status';
    const statusResult = await pool.query(query, params);

    const statusMap = {};
    statusResult.rows.forEach(row => {
      statusMap[row.status] = parseInt(row.count);
    });

    // Pendaftaran this month
    const monthStart = moment().startOf('month').toDate();
    query = `
      SELECT COUNT(*) as count FROM pendaftaran_pernikahan p
      JOIN desa d ON p.desa_id = d.id
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE p.submitted_at >= $1
    `;
    const monthParams = [monthStart, ...params.slice(0, params.length)];
    if (conditions.length > 0) {
      query += ' AND ' + conditions.slice(0, conditions.length).join(' AND ');
    }
    const monthResult = await pool.query(query, monthParams);

    // Total users
    query = `
      SELECT COUNT(*) as count FROM users u
      WHERE u.role IN ('admin_kabupaten', 'admin_kecamatan', 'admin_desa')
    `;
    const userParams = [];
    if (req.user.role === 'admin_kecamatan') {
      query += ' AND (u.kecamatan_id = $1 OR u.role = \'admin_kabupaten\')';
      userParams.push(req.user.kecamatan_id);
    } else if (req.user.role === 'admin_desa') {
      query += ' AND (u.desa_id = $1)';
      userParams.push(req.user.desa_id);
    }
    const userResult = await pool.query(query, userParams);

    // Total berita
    query = `
      SELECT COUNT(*) as count FROM berita WHERE status = 'published'
    `;
    const beritaParams = [];
    if (req.user.role === 'admin_kecamatan') {
      query += ' AND (scope = \'kecamatan\' AND kecamatan_id = $1 OR scope = \'kabupaten\')';
      beritaParams.push(req.user.kecamatan_id);
    } else if (req.user.role === 'admin_desa') {
      query += ' AND scope = \'kabupaten\'';
    }
    const beritaResult = await pool.query(query, beritaParams);

    res.json({
      pendaftaran: {
        total: parseInt(totalResult.rows[0].total),
        pending: statusMap.pending || 0,
        verified: statusMap.verified || 0,
        approved: statusMap.approved || 0,
        rejected: statusMap.rejected || 0,
        this_month: parseInt(monthResult.rows[0].count),
      },
      users: parseInt(userResult.rows[0].count),
      berita: parseInt(beritaResult.rows[0].count),
    });
  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    next(error);
  }
});

// Get recent activities
router.get('/activities/recent', authenticate, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    const result = await pool.query(
      `SELECT id, user_id, action, entity_type, created_at FROM audit_log
       WHERE user_id = $1 OR 1=1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Get recent activities error:', error);
    next(error);
  }
});

// Export pendaftaran data (CSV)
router.get('/export/pendaftaran', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), async (req, res, next) => {
  try {
    const { kecamatan_id, format = 'csv' } = req.query;
    const params = [];
    const conditions = [];

    let query = `
      SELECT p.registration_number, p.groom_name, p.bride_name, p.marriage_date, 
             p.status, d.name as desa_name, k.name as kecamatan_name, p.submitted_at
      FROM pendaftaran_pernikahan p
      JOIN desa d ON p.desa_id = d.id
      JOIN kecamatan k ON d.kecamatan_id = k.id
      WHERE 1=1
    `;

    if (req.user.role === 'admin_kecamatan') {
      conditions.push(`k.id = $${params.length + 1}`);
      params.push(req.user.kecamatan_id);
    } else if (kecamatan_id) {
      conditions.push(`k.id = $${params.length + 1}`);
      params.push(kecamatan_id);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.submitted_at DESC';

    const result = await pool.query(query, params);

    if (format === 'csv') {
      // CSV format
      const headers = ['No. Registrasi', 'Nama Mempelai Pria', 'Nama Mempelai Wanita', 'Tanggal Pernikahan', 'Status', 'Desa', 'Kecamatan', 'Tanggal Submit'];
      let csv = headers.join(',') + '\n';

      result.rows.forEach(row => {
        csv += `"${row.registration_number}","${row.groom_name}","${row.bride_name}","${moment(row.marriage_date).format('DD/MM/YYYY')}","${row.status}","${row.desa_name}","${row.kecamatan_name}","${moment(row.submitted_at).format('DD/MM/YYYY')}"`;
        csv += '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="pendaftaran-' + moment().format('YYYY-MM-DD') + '.csv"');
      res.send(csv);
    }
  } catch (error) {
    logger.error('Export pendaftaran error:', error);
    next(error);
  }
});

module.exports = router;
