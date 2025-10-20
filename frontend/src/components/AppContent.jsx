import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Chat from '../pages/Chat';
import Profile from '../pages/Profile';
import { useAuth } from '../context/AuthContext';
import PrivateRoute from './PrivateRoute';
import GoogleCallbackHandler from './GoogleCallbackHandler';
import { getUnreadMessageCounts } from '../services/api';
import socket from '../services/socket';

const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [globalUnreadCounts, setGlobalUnreadCounts] = useState({});

  const fetchGlobalUnreadCounts = useCallback(async () => {
    if (isAuthenticated && user) {
      try {
        const response = await getUnreadMessageCounts();
        setGlobalUnreadCounts(response.data);
      } catch (err) {
        console.error('Error fetching global unread message counts:', err);
      }
    } else {
      setGlobalUnreadCounts({});
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchGlobalUnreadCounts();

    socket.on('unreadCountsUpdated', () => {
      console.log('AppContent received unreadCountsUpdated event');
      fetchGlobalUnreadCounts();
    });

    return () => {
      socket.off('unreadCountsUpdated');
    };
  }, [fetchGlobalUnreadCounts]);

  return (
    <Routes>
      <Route path="/auth/callback" element={<GoogleCallbackHandler />} />
      <Route path="/" element={<PrivateRoute><Home globalUnreadCounts={globalUnreadCounts} /></PrivateRoute>} />
      <Route path="/chat/:id" element={<PrivateRoute><Chat /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
    </Routes>
  );
};

export default AppContent;