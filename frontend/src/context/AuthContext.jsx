import React, { createContext, useState, useEffect } from 'react';
import api from './api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      api.defaults.headers.Authorization = `Bearer ${savedToken}`;
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.Authorization = `Bearer ${token}`;

      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login gagal';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const register = async (email, password, full_name, phone) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', {
        email,
        password,
        full_name,
        phone,
      });

      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.Authorization = `Bearer ${token}`;

      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Registrasi gagal';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.Authorization;
  };

  const changePassword = async (current_password, new_password) => {
    try {
      setError(null);
      await api.post('/auth/change-password', {
        current_password,
        new_password,
      });
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal mengubah password';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        changePassword,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
