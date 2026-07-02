import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold mb-4">APRI Banggai</h3>
            <p className="text-sm">
              Asosiasi Penghulu Republik Indonesia (APRI) Kabupaten Banggai hadir sebagai pusat informasi dan layanan digital terintegrasi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4">Menu Cepat</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/berita" className="hover:text-white transition">
                  Berita
                </Link>
              </li>
              <li>
                <Link to="/kecamatan" className="hover:text-white transition">
                  Kecamatan
                </Link>
              </li>
              <li>
                <Link to="/pendaftaran/form" className="hover:text-white transition">
                  Pendaftaran Pernikahan
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4">Hubungi Kami</h4>
            <p className="text-sm mb-2">Kantor APRI Kabupaten Banggai</p>
            <p className="text-sm">Banggai, Indonesia</p>
            <p className="text-sm mt-2">Email: info@apribanggai.id</p>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-bold mb-4">Informasi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Tentang APRI
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Syarat & Ketentuan
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm">
            &copy; 2024 APRI Kabupaten Banggai. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
