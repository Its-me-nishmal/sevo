import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import AppContent from './components/AppContent';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NetworkStatusModal from './components/NetworkStatusModal';
import useNetworkStatus from './hooks/useNetworkStatus';

function App() {
  const { isOnline, effectiveConnectionType } = useNetworkStatus();

  return (
    <PWAInstallPrompt>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </AuthProvider>
      </Router>
      <NetworkStatusModal
        isOnline={isOnline}
        effectiveConnectionType={effectiveConnectionType}
        onClose={() => { /* Optional: Add logic to dismiss modal if needed */ }}
      />
    </PWAInstallPrompt>
  );
}

export default App;