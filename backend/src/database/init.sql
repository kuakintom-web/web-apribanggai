-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tables
CREATE TABLE IF NOT EXISTS kecamatan (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS desa (
  id SERIAL PRIMARY KEY,
  kecamatan_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE,
  penghulu_name VARCHAR(255),
  penghulu_phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'public',
  kecamatan_id INT,
  desa_id INT,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id),
  FOREIGN KEY (desa_id) REFERENCES desa(id)
);

CREATE TABLE IF NOT EXISTS berita (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(255),
  category VARCHAR(100),
  author_id INT NOT NULL,
  scope VARCHAR(50) DEFAULT 'kabupaten',
  kecamatan_id INT,
  published_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'draft',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);

CREATE TABLE IF NOT EXISTS pendaftaran_pernikahan (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  groom_name VARCHAR(255) NOT NULL,
  groom_birthdate DATE NOT NULL,
  groom_birthplace VARCHAR(255),
  groom_ktp VARCHAR(20),
  groom_address TEXT,
  groom_religion VARCHAR(50),
  bride_name VARCHAR(255) NOT NULL,
  bride_birthdate DATE NOT NULL,
  bride_birthplace VARCHAR(255),
  bride_ktp VARCHAR(20),
  bride_address TEXT,
  bride_religion VARCHAR(50),
  marriage_date DATE NOT NULL,
  marriage_location VARCHAR(255),
  witness1_name VARCHAR(255) NOT NULL,
  witness2_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  desa_id INT NOT NULL,
  registered_by INT,
  ktp_groom VARCHAR(255),
  ktp_bride VARCHAR(255),
  bukti_domisili VARCHAR(255),
  surat_izin_orang_tua VARCHAR(255),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (desa_id) REFERENCES desa(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS blangko_model_n (
  id SERIAL PRIMARY KEY,
  registration_id INT NOT NULL UNIQUE,
  blangko_number VARCHAR(50) UNIQUE NOT NULL,
  issued_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  pdf_path VARCHAR(255),
  downloaded BOOLEAN DEFAULT FALSE,
  downloaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES pendaftaran_pernikahan(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INT,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_kecamatan ON users(kecamatan_id);
CREATE INDEX IF NOT EXISTS idx_berita_slug ON berita(slug);
CREATE INDEX IF NOT EXISTS idx_berita_status ON berita(status);
CREATE INDEX IF NOT EXISTS idx_berita_published ON berita(published_at);
CREATE INDEX IF NOT EXISTS idx_berita_kecamatan ON berita(kecamatan_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_status ON pendaftaran_pernikahan(status);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_desa ON pendaftaran_pernikahan(desa_id);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_marriage_date ON pendaftaran_pernikahan(marriage_date);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
