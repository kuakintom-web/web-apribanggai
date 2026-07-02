import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

const Home = () => {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              APRI Kabupaten Banggai
            </h1>
            <p className="text-xl mb-8 opacity-90">
              Pusat Informasi Resmi dan Layanan Digital Terintegrasi untuk Asosiasi Penghulu Republik Indonesia
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/pendaftaran/form" className="btn bg-white text-primary-600 hover:bg-gray-100 flex items-center gap-2">
                Daftar Pernikahan <FiArrowRight />
              </Link>
              <Link to="/berita" className="btn border-2 border-white hover:bg-white hover:text-primary-600 flex items-center gap-2">
                Baca Berita <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">Fitur Utama</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Pendaftaran Digital',
                description: 'Pendaftaran pernikahan yang mudah dan cepat dengan sistem digital terintegrasi',
                icon: '📋',
              },
              {
                title: 'Blangko Model N',
                description: 'Download dan cetak blangko Model N dengan mudah setelah pernikahan disetujui',
                icon: '📄',
              },
              {
                title: 'Informasi KUA',
                description: 'Direktori lengkap Kantor Urusan Agama se-Kabupaten Banggai',
                icon: '🏢',
              },
            ].map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Siap Menggunakan Layanan Kami?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Daftar sekarang dan mulai gunakan layanan pendaftaran pernikahan digital yang profesional dan terpercaya.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-primary">
              Daftar Sekarang
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Sudah Punya Akun? Login
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Home;
