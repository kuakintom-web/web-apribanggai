import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import { toast } from 'react-toastify';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';

const AdminBerita = () => {
  const { user } = useAuth();
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Berita',
    featured_image: '',
    status: 'draft',
  });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchBerita();
  }, [page]);

  const fetchBerita = async () => {
    try {
      setLoading(true);
      const response = await api.get('/berita/admin', { params: { page, limit: 10 } });
      setBerita(response.data.data);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      setError('Gagal mengambil data berita');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'title') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      if (imageFile) {
        submitData.append('featured_image', imageFile);
      }

      if (editingId) {
        await api.put(`/berita/${editingId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Berita berhasil diupdate');
      } else {
        await api.post('/berita', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Berita berhasil dibuat');
      }

      resetForm();
      fetchBerita();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan berita');
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus berita ini?')) {
      try {
        await api.delete(`/berita/${id}`);
        toast.success('Berita berhasil dihapus');
        fetchBerita();
      } catch (err) {
        toast.error('Gagal menghapus berita');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Berita',
      featured_image: '',
      status: 'draft',
    });
    setImageFile(null);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading && page === 1) return <Loading />;

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Kelola Berita</h1>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
              <FiPlus /> Tambah Berita
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Edit Berita' : 'Tambah Berita Baru'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label">Judul *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="form-input"
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="Pengumuman">Pengumuman</option>
                    <option value="Berita">Berita</option>
                    <option value="Pelatihan">Pelatihan</option>
                    <option value="Tips">Tips & Trik</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gambar Utama</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    accept="image/*"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Excerpt *</label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konten *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="10"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Judul</th>
                <th>Kategori</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {berita.map(item => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.title}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="text-sm text-gray-600">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
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
      <Footer />
    </>
  );
};

export default AdminBerita;
