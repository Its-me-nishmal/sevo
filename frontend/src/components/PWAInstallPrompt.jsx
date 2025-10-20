import React, { useEffect, useState } from 'react';

const PWAInstallPrompt = ({ children }) => {
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallMessage, setShowInstallMessage] = useState(false);

  useEffect(() => {
    // Detect if the app is running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone || document.referrer.startsWith('android-app://');
    setIsPWA(isStandalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show the install message if not in PWA mode
      if (!isStandalone) {
        setShowInstallMessage(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed on load
    if (isStandalone) {
      setShowInstallMessage(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
          setIsPWA(true); // Assume PWA after user accepts
          setShowInstallMessage(false);
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (isPWA) {
    return children;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '20px',
      zIndex: 9999,
      color: '#333',
      fontFamily: 'sans-serif'
    }}>
      <h1 style={{ fontSize: '2em', marginBottom: '20px' }}>Welcome to Sevo!</h1>
      <p style={{ fontSize: '1.2em', marginBottom: '30px' }}>
        This application is designed to be used as a Progressive Web App (PWA) for the best experience.
      </p>
      {showInstallMessage && deferredPrompt ? (
        <>
          <p style={{ fontSize: '1.1em', marginBottom: '20px' }}>
            Please install Sevo to your home screen to continue.
          </p>
          <button
            onClick={handleInstallClick}
            style={{
              padding: '10px 20px',
              fontSize: '1.1em',
              backgroundColor: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Install Sevo
          </button>
        </>
      ) : (
        <p style={{ fontSize: '1.1em', marginBottom: '20px' }}>
          To use this app, please open it from your home screen after installation.
          Look for the "Add to Home Screen" or "Install App" option in your browser's menu.
        </p>
      )}
      <p style={{ fontSize: '0.9em', marginTop: '30px', color: '#666' }}>
        (If you've already installed it, please launch it from your home screen.)
      </p>
    </div>
  );
};

export default PWAInstallPrompt;