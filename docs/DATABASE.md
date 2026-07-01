# 📊 Database Schema Documentation

## Overview

Database menggunakan PostgreSQL dengan struktur relasional yang dirancang untuk mendukung:
- Manajemen user dengan role-based access
- Publikasi berita berjenjang (Kabupaten, Kecamatan)
- Pendaftaran pernikahan digital
- Audit logging

## Tabel-Tabel Utama

### 1. `users`
Menyimpan data pengguna sistem

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin_kabupaten', 'admin_kecamatan', 'admin_desa', 'public') DEFAULT 'public',
  kecamatan_id INT,
  desa_id INT,
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id),
  FOREIGN KEY (desa_id) REFERENCES desa(id)
);
```

**Fields:**
- `id`: Primary key
- `email`: Unique email untuk login
- `password_hash`: Hash password dengan bcrypt
- `full_name`: Nama lengkap pengguna
- `role`: Peran dalam sistem (4 role utama)
- `kecamatan_id`: Referensi ke kecamatan (untuk admin kecamatan)
- `desa_id`: Referensi ke desa (untuk admin desa)
- `status`: Status aktif/nonaktif user

---

### 2. `kecamatan`
Data kecamatan di Kabupaten Banggai

```sql
CREATE TABLE kecamatan (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. `desa`
Data desa/kelurahan

```sql
CREATE TABLE desa (
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
```

---

### 4. `berita`
Artikel dan berita

```sql
CREATE TABLE berita (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(255),
  category VARCHAR(100),
  author_id INT NOT NULL,
  scope ENUM('kabupaten', 'kecamatan') DEFAULT 'kabupaten',
  kecamatan_id INT,
  published_at TIMESTAMP,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (kecamatan_id) REFERENCES kecamatan(id)
);
```

---

### 5. `pendaftaran_pernikahan`
Data pendaftaran pernikahan

```sql
CREATE TABLE pendaftaran_pernikahan (
  id SERIAL PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Data Pengantin Pria
  groom_name VARCHAR(255) NOT NULL,
  groom_birthdate DATE NOT NULL,
  groom_birthplace VARCHAR(255),
  groom_ktp VARCHAR(20),
  groom_address TEXT,
  groom_religion VARCHAR(50),
  
  -- Data Pengantin Wanita
  bride_name VARCHAR(255) NOT NULL,
  bride_birthdate DATE NOT NULL,
  bride_birthplace VARCHAR(255),
  bride_ktp VARCHAR(20),
  bride_address TEXT,
  bride_religion VARCHAR(50),
  
  -- Data Pernikahan
  marriage_date DATE NOT NULL,
  marriage_location VARCHAR(255),
  witness1_name VARCHAR(255) NOT NULL,
  witness2_name VARCHAR(255) NOT NULL,
  
  -- Status
  status ENUM('pending', 'verified', 'approved', 'rejected') DEFAULT 'pending',
  desa_id INT NOT NULL,
  registered_by INT,
  
  -- Dokumen
  ktp_groom VARCHAR(255),
  ktp_bride VARCHAR(255),
  bukti_domisili VARCHAR(255),
  surat_izin_orang_tua VARCHAR(255),
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (desa_id) REFERENCES desa(id),
  FOREIGN KEY (registered_by) REFERENCES users(id)
);
```

---

### 6. `blangko_model_n`
Template Blangko Model N untuk pernikahan

```sql
CREATE TABLE blangko_model_n (
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
```

---

### 7. `audit_log`
Log aktivitas sistem untuk keamanan

```sql
CREATE TABLE audit_log (
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
```

---

### 8. `settings`
Konfigurasi sistem

```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
```

---

## Relationships Diagram

```
users
├── kecamatan (many-to-one)
├── desa (many-to-one)
├── berita (one-to-many) - as author
├── pendaftaran_pernikahan (one-to-many) - as registered_by
└── audit_log (one-to-many)

kecamatan
├── desa (one-to-many)
└── berita (one-to-many)

desa
├── kecamatan (many-to-one)
└── pendaftaran_pernikahan (one-to-many)

pendaftaran_pernikahan
├── desa (many-to-one)
├── users (many-to-one) - as registered_by
└── blangko_model_n (one-to-one)

berita
├── users (many-to-one) - as author
└── kecamatan (many-to-one)
```

## Indexes untuk Performance

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_kecamatan ON users(kecamatan_id);

-- Berita queries
CREATE INDEX idx_berita_slug ON berita(slug);
CREATE INDEX idx_berita_status ON berita(status);
CREATE INDEX idx_berita_published ON berita(published_at);
CREATE INDEX idx_berita_kecamatan ON berita(kecamatan_id);

-- Pendaftaran pernikahan
CREATE INDEX idx_pendaftaran_status ON pendaftaran_pernikahan(status);
CREATE INDEX idx_pendaftaran_desa ON pendaftaran_pernikahan(desa_id);
CREATE INDEX idx_pendaftaran_marriage_date ON pendaftaran_pernikahan(marriage_date);

-- Audit logging
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
```

## Migration Script

Semua tabel akan dibuat melalui migration files di folder `backend/src/migrations/`

## Backup Strategy

```bash
# Full database backup
pg_dump apri_banggai > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
psql apri_banggai < backup_20240101_120000.sql
```
