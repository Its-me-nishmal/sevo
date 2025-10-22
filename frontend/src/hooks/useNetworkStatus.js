import { useState, useEffect } from 'react';

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [effectiveConnectionType, setEffectiveConnectionType] = useState(
    navigator.connection?.effectiveType || '4g'
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = navigator.connection;
    if (connection) {
      const updateConnection = () => {
        setEffectiveConnectionType(connection.effectiveType);
      };
      connection.addEventListener('change', updateConnection);
      updateConnection(); // Initial check
      return () => {
        connection.removeEventListener('change', updateConnection);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, effectiveConnectionType };
};

export default useNetworkStatus;