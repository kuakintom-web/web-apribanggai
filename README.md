# 🌐 Website APRI Kabupaten Banggai

Pusat Informasi Resmi dan Layanan Digital Terintegrasi untuk Asosiasi Penghulu Republik Indonesia (APRI) Kabupaten Banggai.

## 📌 Tentang Proyek

Website ini dirancang sebagai ekosistem digital yang profesional, adaptif, dan berkemajuan untuk mendukung:

- **Manajemen Organisasi APRI**: Pengelolaan data anggota, kegiatan, dan berita
- **Layanan KUA Digital**: Pendaftaran pernikahan, cetak blangko, dan tracking status
- **Admin Berjenjang**: Kontrol berbasis peran untuk Kabupaten, Kecamatan, dan Desa
- **Transparansi & Aksesibilitas**: Informasi publik yang mudah diakses oleh semua perangkat

## 🏗️ Struktur Proyek

```
web-apribanggai/
├── frontend/                 # Aplikasi React.js
├── backend/                  # API Node.js + Express
├── database/                 # Skema dan migrasi database
├── docs/                     # Dokumentasi proyek
└── docker-compose.yml        # Konfigurasi Docker
```

## ⚡ Teknologi Stack

### Frontend
- **React.js** / Next.js
- **Tailwind CSS** untuk styling responsif
- **Redux** untuk state management
- **Axios** untuk HTTP client

### Backend
- **Node.js** dengan Express.js
- **PostgreSQL** untuk database
- **JWT** untuk authentication
- **Multer** untuk upload file

### DevOps
- **Docker** untuk containerization
- **GitHub Actions** untuk CI/CD

## 🚀 Fitur Utama

### 1. **Sistem Admin Berjenjang**
- ✅ Admin Kabupaten: Kelola semua data, pengguna, dan laporan
- ✅ Admin Kecamatan: Kelola berita dan pendaftaran di tingkat kecamatan
- ✅ Admin Desa: Input pendaftaran pernikahan

### 2. **Manajemen Berita**
- ✅ CRUD berita dengan kategori
- ✅ Publikasi terjadwal
- ✅ Pencarian dan filter
- ✅ Notifikasi update

### 3. **Pendaftaran Pernikahan Digital**
- ✅ Form input dengan validasi lengkap
- ✅ Upload dokumen pendukung (KTP, Surat Nikah, dll)
- ✅ Cetak hasil pendaftaran (PDF)
- ✅ Download Blangko Model N
- ✅ Status tracking real-time
- ✅ Riwayat pendaftaran

### 4. **Portal Publik**
- ✅ Profil dan visi-misi APRI
- ✅ Direktori KUA se-Kabupaten
- ✅ Unduh template dan formulir
- ✅ Galeri kegiatan
- ✅ Artikel dan tips pernikahan

### 5. **Keamanan**
- ✅ Authentication dengan JWT
- ✅ Role-Based Access Control (RBAC)
- ✅ Enkripsi data sensitif
- ✅ HTTPS support
- ✅ Audit logging

## 📋 Instalasi & Setup

### Prasyarat
- Node.js v16+
- PostgreSQL 12+
- Docker & Docker Compose (opsional)
- Git

### Langkah 1: Clone Repository
```bash
git clone https://github.com/kuakintom-web/web-apribanggai.git
cd web-apribanggai
```

### Langkah 2: Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm start
```

### Langkah 3: Setup Frontend
```bash
cd frontend
npm install
npm run dev
```

### Menggunakan Docker
```bash
docker-compose up -d
```

## 📚 Dokumentasi Lengkap

Silakan lihat folder `docs/` untuk:
- [Setup dan Instalasi](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [User Roles & Permissions](./docs/ROLES.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🔐 Keamanan

Untuk menggunakan fitur pendaftaran pernikahan yang melibatkan data pribadi:
1. Setup environment variables untuk database dan JWT secret
2. Aktifkan HTTPS di production
3. Konfigurasi backup database secara berkala
4. Monitor audit log untuk aktivitas mencurigakan

## 👥 Kontribusi

Untuk kontribusi:
1. Buat branch dari `develop`
2. Commit dengan pesan yang jelas
3. Push dan buat Pull Request
4. Tunggu review sebelum merge

## 📞 Support

Untuk pertanyaan atau issue, buka GitHub Issue di repository ini.

## 📄 Lisensi

Proyek ini dilindungi dengan Lisensi MIT.

---

**Dikembangkan untuk APRI Kabupaten Banggai** 🇮🇩
