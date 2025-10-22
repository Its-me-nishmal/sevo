import React from 'react';
import { WifiOff, SignalLow, XCircle } from 'lucide-react';

const NetworkStatusModal = ({ isOnline, effectiveConnectionType, onClose }) => {
  if (isOnline && effectiveConnectionType !== 'slow-2g' && effectiveConnectionType !== '2g') {
    return null; // Only show modal if offline or network is slow
  }

  const getMessage = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-12 h-12 text-red-500" />,
        title: "You're Offline!",
        description: "Please check your internet connection to continue.",
        color: "bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300",
      };
    } else if (effectiveConnectionType === 'slow-2g' || effectiveConnectionType === '2g') {
      return {
        icon: <SignalLow className="w-12 h-12 text-yellow-500" />,
        title: "Low Network Detected",
        description: "Your internet connection is slow. This might affect performance.",
        color: "bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300",
      };
    }
    return null;
  };

  const message = getMessage();

  if (!message) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background-dark/50 backdrop-blur-sm">
      <div className={`relative p-6 rounded-lg shadow-xl max-w-sm w-full text-center ${message.color}`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-text-light/70 dark:text-text-dark/70 hover:text-primary-light dark:hover:text-primary-dark transition-colors"
          aria-label="Close"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <div className="mb-4 flex justify-center">
          {message.icon}
        </div>
        <h2 className="text-2xl font-bold mb-2">{message.title}</h2>
        <p className="text-sm">{message.description}</p>
      </div>
    </div>
  );
};

export default NetworkStatusModal;