import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Loading from './components/common/Loading';
import NotFound from './components/common/NotFound';

// Lazy load pages
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const BeritaList = lazy(() => import('./pages/BeritaList'));
const BeritaDetail = lazy(() => import('./pages/BeritaDetail'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBerita = lazy(() => import('./pages/admin/AdminBerita'));
const AdminPendaftaran = lazy(() => import('./pages/admin/AdminPendaftaran'));
const PendaftaranForm = lazy(() => import('./pages/PendaftaranForm'));
const PendaftaranList = lazy(() => import('./pages/PendaftaranList'));
const KecamatanList = lazy(() => import('./pages/KecamatanList'));

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(user?.role)) {
    return <NotFound />;
  }

  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/berita" element={<BeritaList />} />
          <Route path="/berita/:slug" element={<BeritaDetail />} />
          <Route path="/kecamatan" element={<KecamatanList />} />

          {/* Protected routes - pendaftaran */}
          <Route
            path="/pendaftaran/form"
            element={
              <ProtectedRoute requiredRoles={['admin_desa', 'admin_kecamatan', 'admin_kabupaten']}>
                <PendaftaranForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pendaftaran/list"
            element={
              <ProtectedRoute requiredRoles={['admin_desa', 'admin_kecamatan', 'admin_kabupaten']}>
                <PendaftaranList />
              </ProtectedRoute>
            }
          />

          {/* Protected routes - admin */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRoles={['admin_kabupaten', 'admin_kecamatan', 'admin_desa']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRoles={['admin_kabupaten']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/berita"
            element={
              <ProtectedRoute requiredRoles={['admin_kabupaten', 'admin_kecamatan']}>
                <AdminBerita />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pendaftaran"
            element={
              <ProtectedRoute requiredRoles={['admin_kabupaten', 'admin_kecamatan']}>
                <AdminPendaftaran />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
