import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import AppContent from './components/AppContent';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NetworkStatusModal from './components/NetworkStatusModal';
import useNetworkStatus from './hooks/useNetworkStatus';
import api from './services/api';

function App() {
  const { isOnline, effectiveConnectionType } = useNetworkStatus();

  useEffect(() => {
    // Check for service worker and push notification support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        console.log('Service Worker ready:', registration);

        // Request notification permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          // Check if already subscribed
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log('Existing push subscription:', existingSubscription);
            // Optionally, send the existing subscription to the backend to ensure it's still valid
            await api.post('/push/subscribe', { subscription: existingSubscription });
          } else {
            console.log('No existing push subscription, subscribing...');
            const subscribeOptions = {
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
            };
            const newSubscription = await registration.pushManager.subscribe(subscribeOptions);
            console.log('New push subscription:', newSubscription);
            // Send new subscription to your backend
            await api.post('/push/subscribe', { subscription: newSubscription });
          }
        } else {
          console.warn('Notification permission denied.');
        }
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    } else {
      console.warn('Service Workers or Push Notifications not supported.');
    }
  }, []);

  // Utility function to convert VAPID public key
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

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