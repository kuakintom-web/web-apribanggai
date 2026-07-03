# APRI Kabupaten Banggai - Web Application

Sistem informasi dan layanan digital terintegrasi untuk Asosiasi Penghulu Republik Indonesia Kabupaten Banggai.

## Fitur Utama

- **Pendaftaran Pernikahan Digital**: Form pendaftaran online yang terintegrasi dengan sistem verifikasi berlapis
- **Manajemen Blangko Model N**: Proses penerbitan dan download blangko Model N otomatis
- **Publikasi Berita**: Sistem CMS untuk publikasi berita dan pengumuman
- **Direktori KUA**: Direktori lengkap Kantor Urusan Agama se-Kabupaten Banggai
- **Manajemen User**: Sistem RBAC dengan role admin kabupaten, kecamatan, dan desa
- **Audit Trail**: Pencatatan semua aktivitas admin untuk transparansi

## Tech Stack

### Backend
- Node.js & Express.js
- PostgreSQL
- JWT Authentication
- Docker & Docker Compose

### Frontend
- React.js 18
- Tailwind CSS
- Vite
- Axios
- React Router v6

## Struktur Project

```
web-apribanggai/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── config/
│   │   ├── utils/
│   │   └── database/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── App.jsx
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Getting Started

### Dengan Docker Compose

```bash
# Clone repository
git clone https://github.com/kuakintom-web/web-apribanggai.git
cd web-apribanggai

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env sesuai konfigurasi Anda
vim backend/.env
vim frontend/.env

# Build dan jalankan dengan Docker Compose
docker-compose up -d

# Migrate database
docker-compose exec backend npm run migrate

# Akses aplikasi
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Local Development

#### Backend Setup
```bash
cd backend
npm install

# Setup database
cp .env.example .env
vim .env  # Update konfigurasi database

# Install dependencies
npm install

# Run migration
npm run migrate

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend
npm install

cp .env.example .env
vim .env  # Update API URL jika diperlukan

# Start development server
npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/change-password` - Ubah password

### Pendaftaran Endpoints
- `GET /api/pendaftaran` - Daftar pendaftaran (with filters)
- `GET /api/pendaftaran/:id` - Detail pendaftaran
- `POST /api/pendaftaran` - Buat pendaftaran baru
- `PUT /api/pendaftaran/:id` - Update pendaftaran (draft only)
- `PATCH /api/pendaftaran/:id/submit` - Submit pendaftaran
- `PATCH /api/pendaftaran/:id/verify` - Verify pendaftaran
- `PATCH /api/pendaftaran/:id/approve` - Approve pendaftaran
- `PATCH /api/pendaftaran/:id/reject` - Reject pendaftaran

### Berita Endpoints
- `GET /api/berita` - Daftar berita
- `GET /api/berita/:slug` - Detail berita
- `POST /api/berita` - Buat berita (admin)
- `PUT /api/berita/:id` - Update berita (admin)
- `DELETE /api/berita/:id` - Hapus berita (admin)

### Kecamatan & Desa Endpoints
- `GET /api/kecamatan` - Daftar kecamatan
- `GET /api/kecamatan/:id` - Detail kecamatan dengan desa
- `GET /api/desa` - Daftar desa
- `GET /api/desa/:id` - Detail desa

### Blangko Endpoints
- `GET /api/blangko/:registration_id` - Detail blangko
- `GET /api/blangko/:registration_id/download` - Download blangko PDF
- `GET /api/blangko/stats` - Statistik blangko

## User Roles & Permissions

### Public User
- Baca berita
- Lihat direktori kecamatan/desa
- Input pendaftaran pernikahan

### Admin Desa
- Kelola pendaftaran desa sendiri (create, read, update, submit)
- Lihat statistik desa
- Download blangko (setelah approved)

### Admin Kecamatan
- Lihat dan verifikasi semua pendaftaran kecamatan
- Kelola berita kecamatan
- Lihat statistik kecamatan

### Admin Kabupaten
- Full access to all features
- Approve pendaftaran
- Kelola berita kabupaten
- Kelola user
- Kelola kecamatan dan desa
- Lihat statistik kabupaten

## Database Schema

Tabel utama:
- `users` - Data pengguna
- `pendaftaran_pernikahan` - Data pendaftaran pernikahan
- `berita` - Data berita/publikasi
- `kecamatan` - Data kecamatan
- `desa` - Data desa/kelurahan
- `blangko_model_n` - Data blangko Model N
- `audit_log` - Log aktivitas admin

## Security Features

- JWT-based authentication
- Password hashing dengan bcrypt
- CORS configuration
- Input validation & sanitization
- Rate limiting
- SQL injection prevention
- Audit logging untuk semua aktivitas admin
- File upload validation

## Contributing

Untuk berkontribusi:

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - lihat file LICENSE untuk detail

## Support

Untuk bantuan atau pertanyaan:
- Email: support@apribanggai.id
- Issue: GitHub Issues

## Changelog

### v1.0.0 (2024-07-03)
- Initial release
- Fitur pendaftaran pernikahan digital
- Sistem verifikasi berlapis
- Manajemen blangko Model N
- CMS untuk publikasi berita
- Direktori KUA
