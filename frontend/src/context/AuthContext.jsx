import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Validate token with backend
          const res = await api.get('/auth/current_user');
          setUser(res.data);
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const loginWithGoogle = () => {
    // Redirect to backend Google OAuth route
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/google`;
  };

  const handleGoogleCallback = async (token) => {
    localStorage.setItem('token', token);
    try {
      const res = await api.get('/auth/current_user');
      setUser(res.data);
      navigate('/');
    } catch (error) {
      console.error('Error fetching user after Google callback:', error);
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/users/profile', profileData);
      setUser(res.data.user); // Assuming the backend returns the updated user object
      return { success: true, message: 'Profile updated successfully!' };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to update profile.' };
    }
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, loginWithGoogle, handleGoogleCallback, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);