const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Get blangko Model N for registration
router.get('/:registration_id', authenticate, async (req, res, next) => {
  try {
    const { registration_id } = req.params;

    const result = await pool.query(
      `SELECT b.*, p.groom_name, p.bride_name, p.marriage_date, p.registration_number
       FROM blangko_model_n b
       JOIN pendaftaran_pernikahan p ON b.registration_id = p.id
       WHERE b.registration_id = $1`,
      [registration_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blangko tidak ditemukan' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get blangko error:', error);
    next(error);
  }
});

// Download Blangko Model N as PDF
router.get('/:registration_id/download', authenticate, async (req, res, next) => {
  try {
    const { registration_id } = req.params;

    const result = await pool.query(
      `SELECT b.*, p.groom_name, p.bride_name, p.marriage_date, p.registration_number,
              p.groom_ktp, p.bride_ktp, p.witness1_name, p.witness2_name, p.marriage_location
       FROM blangko_model_n b
       JOIN pendaftaran_pernikahan p ON b.registration_id = p.id
       WHERE b.registration_id = $1`,
      [registration_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blangko tidak ditemukan' });
    }

    const blangko = result.rows[0];

    // Create PDF
    const doc = new PDFDocument({
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Blangko_ModelN_${blangko.registration_number}.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(14).font('Helvetica-Bold').text('BLANGKO MODEL N', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Pernikahan', { align: 'center' });
    doc.moveDown();

    // Header info
    doc.fontSize(9).text(`Nomor Registrasi: ${blangko.registration_number}`);
    doc.text(`Nomor Blangko: ${blangko.blangko_number}`);
    doc.text(`Tanggal Diterbitkan: ${moment(blangko.issued_date).format('DD MMMM YYYY')}`);
    doc.moveDown();

    // Separator
    doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).stroke();
    doc.moveDown();

    // Groom info
    doc.fontSize(10).font('Helvetica-Bold').text('DATA MEMPELAI PRIA');
    doc.font('Helvetica').fontSize(9);
    doc.text(`Nama: ${blangko.groom_name}`);
    doc.text(`No. KTP: ${blangko.groom_ktp}`);
    doc.moveDown();

    // Bride info
    doc.fontSize(10).font('Helvetica-Bold').text('DATA MEMPELAI WANITA');
    doc.font('Helvetica').fontSize(9);
    doc.text(`Nama: ${blangko.bride_name}`);
    doc.text(`No. KTP: ${blangko.bride_ktp}`);
    doc.moveDown();

    // Marriage info
    doc.fontSize(10).font('Helvetica-Bold').text('DATA PERNIKAHAN');
    doc.font('Helvetica').fontSize(9);
    doc.text(`Tanggal: ${moment(blangko.marriage_date).format('DD MMMM YYYY')}`);
    doc.text(`Lokasi: ${blangko.marriage_location}`);
    doc.moveDown();

    // Witnesses
    doc.fontSize(10).font('Helvetica-Bold').text('SAKSI-SAKSI');
    doc.font('Helvetica').fontSize(9);
    doc.text(`1. ${blangko.witness1_name}`);
    doc.text(`2. ${blangko.witness2_name}`);
    doc.moveDown();

    // Signature area
    doc.fontSize(9).text('Ketua APRI Kabupaten Banggai');
    doc.moveDown(3);
    doc.text('_________________________');
    doc.text('(Tanda Tangan dan Nama)');

    // Update download status
    await pool.query(
      'UPDATE blangko_model_n SET downloaded = true, downloaded_at = CURRENT_TIMESTAMP WHERE registration_id = $1',
      [registration_id]
    );

    await pool.query(
      'INSERT INTO audit_log (user_id, action, entity_type, entity_id, status) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, 'DOWNLOAD_BLANGKO', 'blangko_model_n', registration_id, 'success']
    );

    doc.end();
  } catch (error) {
    logger.error('Download blangko error:', error);
    next(error);
  }
});

// Get blangko statistics (admin only)
router.get('/stats', authenticate, authorize(['admin_kabupaten', 'admin_kecamatan']), async (req, res, next) => {
  try {
    const { kecamatan_id } = req.query;
    const params = [];
    const conditions = [];

    let query = `
      SELECT COUNT(*) as total, SUM(CASE WHEN downloaded = true THEN 1 ELSE 0 END) as downloaded,
             SUM(CASE WHEN downloaded = false THEN 1 ELSE 0 END) as not_downloaded
      FROM blangko_model_n b
      JOIN pendaftaran_pernikahan p ON b.registration_id = p.id
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

    const result = await pool.query(query, params);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Get blangko stats error:', error);
    next(error);
  }
});

module.exports = router;
