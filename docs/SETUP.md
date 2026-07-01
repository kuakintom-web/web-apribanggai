# 🚀 Setup & Installation Guide

## Prasyarat

- **Node.js** v16 atau lebih tinggi
- **npm** atau **yarn**
- **PostgreSQL** 12 atau lebih tinggi
- **Git**
- **Docker** & **Docker Compose** (opsional, untuk development yang lebih mudah)

## Instalasi Lokal (Tanpa Docker)

### 1. Clone Repository

```bash
git clone https://github.com/kuakintom-web/web-apribanggai.git
cd web-apribanggai
```

### 2. Setup Database (PostgreSQL)

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE apri_banggai;
CREATE USER apri_user WITH PASSWORD 'apri_secure_pass';
ALTER ROLE apri_user SET client_encoding TO 'utf8';
ALTER ROLE apri_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE apri_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE apri_banggai TO apri_user;

\c apri_banggai
GRANT ALL ON SCHEMA public TO apri_user;
\q
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env dengan konfigurasi database Anda
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=apri_user
# DB_PASSWORD=apri_secure_pass
# DB_NAME=apri_banggai
# JWT_SECRET=your_secret_key_here

# Run migrations
npm run migrate

# Seed database (opsional)
npm run seed

# Start server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Konfigurasi API URL
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Instalasi dengan Docker

### 1. Konfigurasi Environment

```bash
# Copy file .env
cp .env.example .env

# Edit .env sesuai kebutuhan
```

### 2. Build dan Run Containers

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Run Migrations

```bash
# Akses container backend
docker-compose exec backend npm run migrate

# Seed database (opsional)
docker-compose exec backend npm run seed
```

Aplikasi akan tersedia di:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Database: `localhost:5432`

## Useful Commands

### Backend

```bash
cd backend

# Development
npm run dev

# Production
npm run build
npm start

# Database migrations
npm run migrate
npm run migrate:rollback

# Seed database
npm run seed

# Testing
npm test

# Linting
npm run lint
```

### Frontend

```bash
cd frontend

# Development
npm run dev

# Build for production
npm run build

# Start production build
npm start

# Testing
npm test

# Linting
npm run lint
```

### Docker

```bash
# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose down

# Remove volumes (hati-hati, data akan hilang)
docker-compose down -v

# Execute command in container
docker-compose exec [service_name] [command]
```

## Default Admin Credentials

Setelah seed database, gunakan akun berikut untuk login:

- **Admin Kabupaten**
  - Email: `admin.kabupaten@apri.local`
  - Password: `Admin@123456`

- **Admin Kecamatan (Sample)**
  - Email: `admin.toili@apri.local`
  - Password: `Admin@123456`

**⚠️ PENTING**: Ubah password ini segera setelah login di production!

## Troubleshooting

### Port sudah digunakan

```bash
# Cari proses yang menggunakan port
lsof -i :5000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # Database

# Kill proses
kill -9 [PID]

# Atau gunakan port berbeda di .env
```

### Database connection error

```bash
# Verifikasi PostgreSQL running
sudo service postgresql status

# Atau gunakan Docker
sudo docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

### Node modules issue

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Selanjutnya

- Lihat [API Documentation](./API.md) untuk endpoint details
- Baca [Database Schema](./DATABASE.md) untuk struktur data
- Pelajari [User Roles](./ROLES.md) untuk permission management
