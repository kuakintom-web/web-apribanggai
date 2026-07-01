const pool = require('../config/database');
const logger = require('../utils/logger');
const { hashPassword, generateRegistrationNumber } = require('../utils/crypto');

const seed = async () => {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database seeding...');
    
    await client.query('BEGIN');
    
    // Create kecamatan
    const kecamatanData = [
      { name: 'Toili', code: 'TL' },
      { name: 'Toili Timur', code: 'TLT' },
      { name: 'Toili Barat', code: 'TLB' },
      { name: 'Tuhemberua', code: 'TH' },
      { name: 'Banggai Tengah', code: 'BT' },
      { name: 'Banggai Barat', code: 'BB' },
    ];
    
    for (const kec of kecamatanData) {
      await client.query(
        'INSERT INTO kecamatan (name, code) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING',
        [kec.name, kec.code]
      );
    }
    logger.info('Kecamatan data seeded');
    
    // Get kecamatan IDs
    const kecResult = await client.query('SELECT id, code FROM kecamatan');
    const kecMap = {};
    kecResult.rows.forEach(row => {
      kecMap[row.code] = row.id;
    });
    
    // Create desa
    const desaData = [
      { kecamatan_code: 'TL', name: 'Panjang', penghulu: 'H. Sulaiman' },
      { kecamatan_code: 'TL', name: 'Basi', penghulu: 'H. Ahmad' },
      { kecamatan_code: 'TL', name: 'Tumanggal', penghulu: 'H. Ibrahim' },
      { kecamatan_code: 'TLT', name: 'Tolai', penghulu: 'H. Usman' },
      { kecamatan_code: 'TLT', name: 'Tukang Ikan', penghulu: 'H. Ali' },
      { kecamatan_code: 'TLB', name: 'Kamandihe', penghulu: 'H. Hassan' },
      { kecamatan_code: 'TH', name: 'Banggai', penghulu: 'H. Salim' },
      { kecamatan_code: 'BT', name: 'Panggean', penghulu: 'H. Hasan' },
      { kecamatan_code: 'BB', name: 'Balua', penghulu: 'H. Kadir' },
    ];
    
    for (const desa of desaData) {
      const kecId = kecMap[desa.kecamatan_code];
      await client.query(
        'INSERT INTO desa (kecamatan_id, name, penghulu_name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [kecId, desa.name, desa.penghulu]
      );
    }
    logger.info('Desa data seeded');
    
    // Create admin users
    const adminKabPassword = await hashPassword('Admin@123456');
    
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, status) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO NOTHING`,
      [
        'admin.kabupaten@apri.local',
        adminKabPassword,
        'Admin Kabupaten Banggai',
        '082123456789',
        'admin_kabupaten',
        'active'
      ]
    );
    logger.info('Admin kabupaten user created');
    
    // Create admin kecamatan for Toili
    await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, kecamatan_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [
        'admin.toili@apri.local',
        adminKabPassword,
        'Admin Kecamatan Toili',
        '082234567890',
        'admin_kecamatan',
        kecMap['TL'],
        'active'
      ]
    );
    logger.info('Admin kecamatan user created');
    
    // Create admin desa for Panjang
    const desaResult = await client.query('SELECT id FROM desa WHERE name = $1 LIMIT 1', ['Panjang']);
    if (desaResult.rows.length > 0) {
      const desaId = desaResult.rows[0].id;
      await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, desa_id, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [
          'admin.panjang@apri.local',
          adminKabPassword,
          'Admin Desa Panjang',
          '082345678901',
          'admin_desa',
          desaId,
          'active'
        ]
      );
      logger.info('Admin desa user created');
    }
    
    // Create sample berita
    const userResult = await client.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin_kabupaten']);
    if (userResult.rows.length > 0) {
      const authorId = userResult.rows[0].id;
      await client.query(
        `INSERT INTO berita (title, slug, content, excerpt, category, author_id, scope, status, published_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          'Selamat Datang di Website APRI Kabupaten Banggai',
          'selamat-datang-apri-banggai',
          'Kami dengan bangga mempersembahkan platform digital terpadu untuk Asosiasi Penghulu Republik Indonesia (APRI) Kabupaten Banggai. Website ini dirancang untuk meningkatkan layanan administrasi pernikahan dan memperkuat koordinasi antar lembaga.',
          'Platform digital untuk APRI Kabupaten Banggai kini hadir dengan fitur-fitur modern dan terintegrasi.',
          'Pengumuman',
          authorId,
          'kabupaten',
          'published',
          new Date()
        ]
      );
    }
    logger.info('Sample berita created');
    
    await client.query('COMMIT');
    logger.info('Database seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

seed().catch((err) => {
  logger.error('Fatal error during seeding:', err);
  process.exit(1);
});
