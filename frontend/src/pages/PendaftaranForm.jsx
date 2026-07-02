import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { FiUpload } from 'react-icons/fi';

const PendaftaranForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [desa, setDesa] = useState([]);
  const [formData, setFormData] = useState({
    groom_name: '',
    groom_birthdate: '',
    groom_birthplace: '',
    groom_ktp: '',
    groom_address: '',
    groom_religion: 'Islam',
    bride_name: '',
    bride_birthdate: '',
    bride_birthplace: '',
    bride_ktp: '',
    bride_address: '',
    bride_religion: 'Islam',
    marriage_date: '',
    marriage_location: '',
    witness1_name: '',
    witness2_name: '',
    desa_id: '',
  });
  const [files, setFiles] = useState({});

  useEffect(() => {
    if (user?.desa_id) {
      setFormData(prev => ({ ...prev, desa_id: user.desa_id }));
    } else {
      fetchDesa();
    }
  }, [user]);

  const fetchDesa = async () => {
    try {
      const response = await api.get('/desa?limit=100');
      setDesa(response.data.data);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Gagal mengambil data desa');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: inputFiles } = e.target;
    if (inputFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: inputFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        formDataObj.append(key, formData[key]);
      });
      Object.keys(files).forEach(key => {
        formDataObj.append(key, files[key]);
      });

      const response = await api.post('/pendaftaran', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Pendaftaran berhasil dibuat!');
      navigate('/pendaftaran/list');
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal membuat pendaftaran';
      toast.error(errorMsg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Form Pendaftaran Pernikahan</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Desa Selection */}
          {!user?.desa_id && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Pilih Desa</h2>
              <select
                name="desa_id"
                value={formData.desa_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">-- Pilih Desa --</option>
                {desa.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} - {d.kecamatan_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Groom Section */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Data Mempelai Pria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  name="groom_name"
                  value={formData.groom_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">No. KTP (16 digit) *</label>
                <input
                  type="text"
                  name="groom_ktp"
                  value={formData.groom_ktp}
                  onChange={handleChange}
                  maxLength="16"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tempat Lahir *</label>
                <input
                  type="text"
                  name="groom_birthplace"
                  value={formData.groom_birthplace}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Lahir *</label>
                <input
                  type="date"
                  name="groom_birthdate"
                  value={formData.groom_birthdate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Alamat *</label>
                <textarea
                  name="groom_address"
                  value={formData.groom_address}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Agama *</label>
                <select
                  name="groom_religion"
                  value={formData.groom_religion}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Budha">Budha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Upload KTP</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="file"
                    name="ktp_groom"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="ktp_groom"
                  />
                  <label htmlFor="ktp_groom" className="cursor-pointer flex items-center gap-2">
                    <FiUpload />
                    {files.ktp_groom ? files.ktp_groom.name : 'Pilih file KTP'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bride Section */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Data Mempelai Wanita</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input
                  type="text"
                  name="bride_name"
                  value={formData.bride_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">No. KTP (16 digit) *</label>
                <input
                  type="text"
                  name="bride_ktp"
                  value={formData.bride_ktp}
                  onChange={handleChange}
                  maxLength="16"
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tempat Lahir *</label>
                <input
                  type="text"
                  name="bride_birthplace"
                  value={formData.bride_birthplace}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Lahir *</label>
                <input
                  type="date"
                  name="bride_birthdate"
                  value={formData.bride_birthdate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group md:col-span-2">
                <label className="form-label">Alamat *</label>
                <textarea
                  name="bride_address"
                  value={formData.bride_address}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Agama *</label>
                <select
                  name="bride_religion"
                  value={formData.bride_religion}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Budha">Budha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Upload KTP</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="file"
                    name="ktp_bride"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="ktp_bride"
                  />
                  <label htmlFor="ktp_bride" className="cursor-pointer flex items-center gap-2">
                    <FiUpload />
                    {files.ktp_bride ? files.ktp_bride.name : 'Pilih file KTP'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Marriage Details */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Detail Pernikahan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tanggal Pernikahan *</label>
                <input
                  type="date"
                  name="marriage_date"
                  value={formData.marriage_date}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lokasi Pernikahan *</label>
                <input
                  type="text"
                  name="marriage_location"
                  value={formData.marriage_location}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Saksi 1 *</label>
                <input
                  type="text"
                  name="witness1_name"
                  value={formData.witness1_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Saksi 2 *</label>
                <input
                  type="text"
                  name="witness2_name"
                  value={formData.witness2_name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Documents Upload */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6 border-b pb-4">Dokumen Pendukung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Bukti Domisili</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="file"
                    name="bukti_domisili"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="bukti_domisili"
                  />
                  <label htmlFor="bukti_domisili" className="cursor-pointer flex items-center gap-2">
                    <FiUpload />
                    {files.bukti_domisili ? files.bukti_domisili.name : 'Pilih file'}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Surat Izin Orang Tua</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-primary-600 transition">
                  <input
                    type="file"
                    name="surat_izin_orang_tua"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    id="surat_izin_orang_tua"
                  />
                  <label htmlFor="surat_izin_orang_tua" className="cursor-pointer flex items-center gap-2">
                    <FiUpload />
                    {files.surat_izin_orang_tua ? files.surat_izin_orang_tua.name : 'Pilih file'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Menyimpan...' : 'Simpan Pendaftaran'}
            </button>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default PendaftaranForm;
