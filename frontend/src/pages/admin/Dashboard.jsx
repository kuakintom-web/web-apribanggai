import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { FiBarChart3, FiFileText, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Loading from '../../components/common/Loading';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard');
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Gagal mengambil data statistik');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Selamat datang, {user?.full_name}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Pendaftaran</p>
                  <p className="text-3xl font-bold">{stats.pendaftaran.total}</p>
                </div>
                <FiFileText className="text-4xl text-primary-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Pending</p>
                  <p className="text-3xl font-bold">{stats.pendaftaran.pending}</p>
                </div>
                <FiAlertCircle className="text-4xl text-yellow-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Approved</p>
                  <p className="text-3xl font-bold">{stats.pendaftaran.approved}</p>
                </div>
                <FiCheckCircle className="text-4xl text-green-600" />
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Berita</p>
                  <p className="text-3xl font-bold">{stats.berita}</p>
                </div>
                <FiBarChart3 className="text-4xl text-blue-600" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Menu Cepat</h2>
            <div className="space-y-2">
              {(['admin_desa', 'admin_kecamatan', 'admin_kabupaten'].includes(user?.role)) && (
                <>
                  <Link to="/pendaftaran/list" className="block btn btn-secondary">
                    Lihat Pendaftaran
                  </Link>
                  {['admin_desa'].includes(user?.role) && (
                    <Link to="/pendaftaran/form" className="block btn btn-primary">
                      Input Pendaftaran Baru
                    </Link>
                  )}
                </>
              )}
              {['admin_kabupaten', 'admin_kecamatan'].includes(user?.role) && (
                <>
                  <Link to="/admin/berita" className="block btn btn-secondary">
                    Kelola Berita
                  </Link>
                  <Link to="/admin/pendaftaran" className="block btn btn-secondary">
                    Kelola Pendaftaran
                  </Link>
                </>
              )}
              {user?.role === 'admin_kabupaten' && (
                <Link to="/admin/users" className="block btn btn-secondary">
                  Kelola User
                </Link>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold mb-4">Informasi Akun</h2>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600 text-sm">Nama</p>
                <p className="font-semibold">{user?.full_name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Role</p>
                <p className="font-semibold badge badge-primary">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
