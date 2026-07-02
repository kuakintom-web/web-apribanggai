import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import Loading from '../../components/common/Loading';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const BeritaList = () => {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        setLoading(true);
        const params = {
          page,
          limit: 10,
          ...(search && { search }),
          ...(category && { category }),
        };
        const response = await api.get('/berita', { params });
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

    fetchBerita();
  }, [page, search, category]);

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Berita & Publikasi</h1>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Cari Berita</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari judul atau konten..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="form-select"
              >
                <option value="">Semua Kategori</option>
                <option value="Pengumuman">Pengumuman</option>
                <option value="Berita">Berita</option>
                <option value="Pelatihan">Pelatihan</option>
                <option value="Tips">Tips & Trik</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : berita.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Tidak ada berita ditemukan</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {berita.map(item => (
                <div key={item.id} className="card hover:shadow-lg transition">
                  <div className="flex gap-6">
                    {item.featured_image && (
                      <img
                        src={item.featured_image}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold mb-2 hover:text-primary-600">
                            <Link to={`/berita/${item.slug}`}>{item.title}</Link>
                          </h3>
                          <div className="flex gap-3 mb-3">
                            <span className="badge badge-primary">{item.category}</span>
                            <span className="text-sm text-gray-600">
                              {formatDistanceToNow(new Date(item.created_at), {
                                addSuffix: true,
                                locale: id,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{item.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Oleh: {item.author}</span>
                        <Link to={`/berita/${item.slug}`} className="text-primary-600 hover:text-primary-700 font-semibold">
                          Baca Selengkapnya →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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

export default BeritaList;
