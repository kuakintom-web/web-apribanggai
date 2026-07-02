import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
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
  );
};

export default NotFound;
