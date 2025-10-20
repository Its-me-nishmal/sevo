import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import AppContent from './components/AppContent';
import PWAInstallPrompt from './components/PWAInstallPrompt'; // Import the PWAInstallPrompt component

function App() {
  return (
    <PWAInstallPrompt>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* AppContent will handle all other routes and unread counts */}
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </Router>
    </PWAInstallPrompt>
  );
}

export default App;