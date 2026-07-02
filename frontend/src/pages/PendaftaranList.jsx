import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import { FiDownload, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const PendaftaranList = () => {
  const { user } = useAuth();
  const [pendaftaran, setPendaftaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchPendaftaran = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 10, ...(status && { status }) };
        const response = await api.get('/pendaftaran', { params });
        setPendaftaran(response.data.data);
        setPagination(response.data.pagination);
        setError(null);
      } catch (err) {
        setError('Gagal mengambil data pendaftaran');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendaftaran();
  }, [page, status]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      verified: 'badge-info',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return badges[status] || 'badge-primary';
  };

  const handleDownloadBlangko = async (registrationId) => {
    try {
      const response = await api.get(`/blangko/${registrationId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `blangko-${registrationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Daftar Pendaftaran Pernikahan</h1>
          {['admin_desa', 'admin_kecamatan', 'admin_kabupaten'].includes(user?.role) && (
            <Link to="/pendaftaran/form" className="btn btn-primary">
              + Input Baru
            </Link>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="form-select max-w-xs"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Registrasi</th>
                    <th>Mempelai</th>
                    <th>Tanggal Nikah</th>
                    <th>Status</th>
                    <th>Tanggal Daftar</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendaftaran.map(item => (
                    <tr key={item.id}>
                      <td className="font-mono text-sm">{item.registration_number}</td>
                      <td>
                        <div className="text-sm">
                          <p className="font-semibold">{item.groom_name}</p>
                          <p className="text-gray-600">&amp; {item.bride_name}</p>
                        </div>
                      </td>
                      <td>{new Date(item.marriage_date).toLocaleDateString('id-ID')}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(item.submitted_at), {
                          addSuffix: true,
                          locale: id,
                        })}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link
                            to={`/pendaftaran/${item.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            <FiEye size={18} />
                          </Link>
                          {item.status === 'approved' && (
                            <button
                              onClick={() => handleDownloadBlangko(item.id)}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              <FiDownload size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Halaman {page} dari {pagination.pages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PendaftaranList;
