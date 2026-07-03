import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const NotFound = () => {
  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <p className="text-2xl text-gray-900 mb-2">Halaman tidak ditemukan</p>
          <p className="text-gray-600 mb-8">
            Maaf, halaman yang Anda cari tidak ada atau sudah dihapus.
          </p>
          <Link to="/" className="btn btn-primary">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default NotFound;
