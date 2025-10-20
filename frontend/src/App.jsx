import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import AppContent from './components/AppContent'; // Import the new component

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* AppContent will handle all other routes and unread counts */}
          <Route path="/*" element={<AppContent />} /> 
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;