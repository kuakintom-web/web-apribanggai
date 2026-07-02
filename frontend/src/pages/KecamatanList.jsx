import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';

const KecamatanList = () => {
  const [kecamatan, setKecamatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);

  useEffect(() => {
    const fetchKecamatan = async () => {
      try {
        const response = await api.get('/kecamatan?limit=100');
        setKecamatan(response.data.data);
        setError(null);
      } catch (err) {
        setError('Gagal mengambil data kecamatan');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchKecamatan();
  }, []);

  const handleSelectKecamatan = async (kecId) => {
    try {
      const response = await api.get(`/kecamatan/${kecId}`);
      setSelectedKecamatan(response.data);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Direktori Kecamatan & KUA</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kecamatan List */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Daftar Kecamatan</h2>
              <div className="space-y-2">
                {kecamatan.map(kec => (
                  <button
                    key={kec.id}
                    onClick={() => handleSelectKecamatan(kec.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      selectedKecamatan?.id === kec.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-600'
                    }`}
                  >
                    <h3 className="font-semibold">{kec.name}</h3>
                    <p className="text-sm text-gray-600">Kode: {kec.code}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Detail View */}
            <div className="lg:col-span-2">
              {selectedKecamatan ? (
                <div>
                  <div className="card mb-6">
                    <h2 className="text-2xl font-bold mb-4">{selectedKecamatan.name}</h2>
                    <p className="text-gray-600 mb-4">{selectedKecamatan.description}</p>
                  </div>

                  <h3 className="text-xl font-bold mb-4">Desa/Kelurahan di {selectedKecamatan.name}</h3>
                  <div className="grid gap-4">
                    {selectedKecamatan.desa && selectedKecamatan.desa.length > 0 ? (
                      selectedKecamatan.desa.map(desa => (
                        <div key={desa.id} className="card">
                          <h4 className="text-lg font-semibold mb-3">{desa.name}</h4>
                          {desa.penghulu_name && (
                            <div className="space-y-2 text-sm">
                              <div>
                                <p className="text-gray-600">Penghulu:</p>
                                <p className="font-semibold">{desa.penghulu_name}</p>
                              </div>
                              {desa.penghulu_phone && (
                                <div className="flex items-center gap-2 text-gray-700">
                                  <FiPhone size={16} />
                                  <a href={`tel:${desa.penghulu_phone}`}>{desa.penghulu_phone}</a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">Tidak ada desa ditemukan</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12 text-gray-600">
                  Pilih kecamatan di sebelah kiri untuk melihat detail
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default KecamatanList;
