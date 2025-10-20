import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GoogleCallbackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleCallback } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      handleGoogleCallback(token);
    } else {
      // If no token, redirect to login or home
      navigate('/login');
    }
  }, [location, navigate, handleGoogleCallback]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-700 dark:text-gray-200 text-lg">Processing Google login...</p>
    </div>
  );
};

export default GoogleCallbackHandler;