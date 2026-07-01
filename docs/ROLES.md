# 👥 User Roles & Permissions

## Overview

Sistem menggunakan Role-Based Access Control (RBAC) dengan 4 role utama:

1. **Admin Kabupaten** - Kontrol penuh sistem
2. **Admin Kecamatan** - Kelola data kecamatan tertentu
3. **Admin Desa** - Input data di tingkat desa
4. **Public User** - Akses baca-saja konten publik

---

## Role: Admin Kabupaten

**Deskripsi**: Pengelola utama sistem dengan akses penuh

### Permissions

#### Dashboard & Reporting
- ✅ Lihat dashboard statistik kabupaten
- ✅ Generate laporan lengkap
- ✅ Monitor aktivitas semua admin

#### User Management
- ✅ Create/Edit/Delete user
- ✅ Assign role kepada user
- ✅ Reset password user
- ✅ Suspend/activate user
- ✅ View audit log

#### Berita Management
- ✅ Create/Edit/Delete berita (kabupaten level)
- ✅ Publish/Unpublish berita
- ✅ Moderate berita dari semua kecamatan
- ✅ Manage kategori berita

#### Pendaftaran Pernikahan
- ✅ View semua pendaftaran
- ✅ Verify/Approve/Reject pendaftaran
- ✅ Generate blangko Model N
- ✅ Export data pendaftaran
- ✅ Print laporan pernikahan

#### Settings & Configuration
- ✅ Manage organisasi APRI
- ✅ Configure email templates
- ✅ Manage file uploads
- ✅ Configure system settings

---

## Role: Admin Kecamatan

**Deskripsi**: Pengelola data di tingkat kecamatan tertentu

### Permissions

#### Dashboard
- ✅ Lihat statistik kecamatan sendiri
- ✅ Lihat aktivitas user di kecamatan

#### Berita Management (Kecamatan Level)
- ✅ Create/Edit/Delete berita kecamatan
- ✅ Publish berita kecamatan
- ✅ View berita dari kabupaten

#### User Management (Limited)
- ✅ View user di kecamatan sendiri
- ✅ View user desa di kecamatan
- ❌ Tidak bisa delete user
- ❌ Tidak bisa assign admin baru

#### Pendaftaran Pernikahan (Kecamatan Level)
- ✅ View pendaftaran di kecamatan
- ✅ Verify pendaftaran
- ⚠️ Approve dengan approval admin kabupaten
- ✅ Export data kecamatan

#### Desa Management
- ✅ View desa di kecamatan
- ✅ View admin desa

---

## Role: Admin Desa

**Deskripsi**: Input data pendaftaran pernikahan di tingkat desa

### Permissions

#### Pendaftaran Pernikahan (Desa Level)
- ✅ Create pendaftaran pernikahan baru
- ✅ Edit data pendaftaran draft
- ✅ Submit pendaftaran ke kecamatan
- ✅ View status pendaftaran
- ✅ Print/Download blangko (setelah approved)
- ❌ Tidak bisa delete pendaftaran
- ❌ Tidak bisa approve/reject

#### Dashboard
- ✅ Lihat statistik desa
- ✅ Lihat daftar pendaftaran

#### Berita
- ✅ View berita dari kabupaten dan kecamatan
- ❌ Tidak bisa create/edit berita

---

## Role: Public User

**Deskripsi**: Pengguna publik, akses baca-saja

### Permissions

#### Content Public
- ✅ Read berita publik
- ✅ View profil APRI
- ✅ View direktori KUA
- ✅ Download template dan formulir
- ✅ Search berita

#### Pendaftaran
- ⚠️ Perlu akses desa untuk input pendaftaran
- ❌ Tidak bisa approve/reject

#### Admin Features
- ❌ Tidak bisa akses admin panel
- ❌ Tidak bisa view user list
- ❌ Tidak bisa edit setting

---

## Permission Matrix

| Feature | Admin Kab | Admin Kec | Admin Desa | Public |
|---------|-----------|-----------|-----------|--------|
| Dashboard | ✅ Full | ✅ Kec | ✅ Desa | ❌ |
| User Mgmt | ✅ Full | ⚠️ View | ❌ | ❌ |
| Berita (Kab) | ✅ CRUD | ✅ Read | ✅ Read | ✅ Read |
| Berita (Kec) | ✅ CRUD | ✅ CRUD | ✅ Read | ✅ Read |
| Berita (Desa) | ✅ View | ✅ View | ✅ View | ✅ Read |
| Pendaftaran Input | ✅ View | ✅ View | ✅ CRUD | ❌ |
| Pendaftaran Verify | ✅ Verify | ✅ Verify | ❌ | ❌ |
| Pendaftaran Approve | ✅ Approve | ⚠️ Recommend | ❌ | ❌ |
| Blangko Model N | ✅ Generate | ✅ View | ✅ Download | ❌ |
| Settings | ✅ Full | ❌ | ❌ | ❌ |
| Audit Log | ✅ View | ❌ | ❌ | ❌ |
| Reports | ✅ Generate | ⚠️ Kec Only | ❌ | ❌ |

---

## Implementation Details

### Middleware Authentication

```javascript
// Contoh middleware di Express.js
const checkRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// Usage
router.post('/api/berita', checkRole(['admin_kabupaten', 'admin_kecamatan']), createBerita);
```

### Scope-Based Queries

```javascript
// Admin kecamatan hanya bisa akses berita kecamatan-nya
const getBerita = async (req, res) => {
  let query = Berita.query();
  
  if (req.user.role === 'admin_kecamatan') {
    query = query.where('kecamatan_id', req.user.kecamatan_id);
  }
  
  const berita = await query;
  res.json(berita);
};
```

---

## Access Control Examples

### ✅ Admin Kabupaten
- Bisa create berita dengan scope 'kabupaten'
- Bisa create berita dengan scope 'kecamatan' untuk semua kecamatan
- Bisa approve pendaftaran dari semua desa

### ✅ Admin Kecamatan (Toili)
- Bisa create berita untuk 'Kecamatan Toili' saja
- Bisa lihat pendaftaran di desa-desa kecamatan Toili
- Tidak bisa create berita untuk kecamatan lain

### ✅ Admin Desa (Panjang)
- Bisa create pendaftaran pernikahan
- Bisa edit pendaftaran draft sendiri
- Tidak bisa approve pendaftaran
- Tidak bisa create berita

---

## Security Best Practices

1. **JWT Token**: Setiap request authenticated dengan JWT
2. **Role Verification**: Backend verify role untuk setiap action
3. **Audit Logging**: Semua action dicatat di audit_log
4. **Rate Limiting**: API protected dari brute force
5. **HTTPS Only**: Semua data encrypted in transit
6. **Password Policy**: Minimal 8 karakter, mix case, number, symbol
