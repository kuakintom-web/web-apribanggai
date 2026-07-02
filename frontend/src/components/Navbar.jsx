import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-primary-600">APRI</span>
          <span className="text-sm text-gray-600">Kabupaten Banggai</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link to="/berita" className="text-gray-700 hover:text-primary-600">
            Berita
          </Link>
          <Link to="/kecamatan" className="text-gray-700 hover:text-primary-600">
            Kecamatan
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-primary-600">
                Dashboard
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700">{user?.full_name}</span>
                <button
                  onClick={logout}
                  className="btn btn-secondary text-sm flex items-center space-x-1"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary text-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary text-sm">
                Daftar
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200">
          <div className="container py-4 space-y-3">
            <Link to="/berita" className="block text-gray-700 hover:text-primary-600">
              Berita
            </Link>
            <Link to="/kecamatan" className="block text-gray-700 hover:text-primary-600">
              Kecamatan
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block text-gray-700 hover:text-primary-600">
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-secondary text-sm w-full justify-center"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary text-sm w-full justify-center block">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary text-sm w-full justify-center block">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
