import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';
import { FiCheckCircle, FiX, FiEye, FiDownload } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const AdminPendaftaran = () => {
  const { user } = useAuth();
  const [pendaftaran, setPendaftaran] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [pagination, setPagination] = useState({});
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendaftaran();
  }, [page, status]);

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

  const handleVerify = async (id) => {
    try {
      await api.patch(`/pendaftaran/${id}/verify`, { notes });
      toast.success('Pendaftaran berhasil diverify');
      setSelectedItem(null);
      setNotes('');
      fetchPendaftaran();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal verify pendaftaran');
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.patch(`/pendaftaran/${id}/approve`, { notes });
      toast.success('Pendaftaran berhasil diapprove');
      setSelectedItem(null);
      setNotes('');
      fetchPendaftaran();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal approve pendaftaran');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan harus diisi');
      return;
    }
    try {
      await api.patch(`/pendaftaran/${id}/reject`, { reason: rejectReason });
      toast.success('Pendaftaran berhasil ditolak');
      setSelectedItem(null);
      setRejectReason('');
      fetchPendaftaran();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal reject pendaftaran');
    }
  };

  const downloadBlangko = async (registrationId) => {
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
      toast.error('Gagal download blangko');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      verified: 'badge-info',
      approved: 'badge-success',
      rejected: 'badge-danger',
    };
    return badges[status] || 'badge-primary';
  };

  if (loading) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Kelola Pendaftaran Pernikahan</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>No. Registrasi</th>
                    <th>Mempelai</th>
                    <th>Tanggal Nikah</th>
                    <th>Status</th>
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
                      <td>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <FiEye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div className="lg:col-span-1">
              <div className="card sticky top-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <FiX size={20} />
                </button>

                <h3 className="text-lg font-bold mb-4">Detail Pendaftaran</h3>

                <div className="space-y-3 text-sm mb-6">
                  <div>
                    <p className="text-gray-600">No. Registrasi</p>
                    <p className="font-semibold font-mono">{selectedItem.registration_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className={`font-semibold badge ${getStatusBadge(selectedItem.status)}`}>
                      {selectedItem.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mempelai Pria</p>
                    <p className="font-semibold">{selectedItem.groom_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Mempelai Wanita</p>
                    <p className="font-semibold">{selectedItem.bride_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tanggal Pernikahan</p>
                    <p className="font-semibold">
                      {new Date(selectedItem.marriage_date).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Lokasi Pernikahan</p>
                    <p className="font-semibold">{selectedItem.marriage_location}</p>
                  </div>
                </div>

                {/* Actions */}
                {selectedItem.status === 'pending' && ['admin_kecamatan', 'admin_kabupaten'].includes(user?.role) && (
                  <div className="space-y-4">
                    <div>
                      <label className="form-label text-xs">Catatan Verifikasi</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="form-textarea text-sm"
                        rows="2"
                      />
                    </div>
                    <button
                      onClick={() => handleVerify(selectedItem.id)}
                      className="btn btn-success w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <FiCheckCircle /> Verify
                    </button>
                    <div>
                      <label className="form-label text-xs">Alasan Penolakan</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="form-textarea text-sm"
                        rows="2"
                        placeholder="Jelaskan alasan penolakan..."
                      />
                    </div>
                    <button
                      onClick={() => handleReject(selectedItem.id)}
                      className="btn btn-danger w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                )}

                {selectedItem.status === 'verified' && user?.role === 'admin_kabupaten' && (
                  <div>
                    <div className="mb-4">
                      <label className="form-label text-xs">Catatan Approval</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="form-textarea text-sm"
                        rows="2"
                      />
                    </div>
                    <button
                      onClick={() => handleApprove(selectedItem.id)}
                      className="btn btn-success w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <FiCheckCircle /> Approve
                    </button>
                  </div>
                )}

                {selectedItem.status === 'approved' && (
                  <button
                    onClick={() => downloadBlangko(selectedItem.id)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 text-sm"
                  >
                    <FiDownload /> Download Blangko
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminPendaftaran;
