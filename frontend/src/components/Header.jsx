import React, { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, showBackButton, onBack, chatPartnerStatus }) => {
  const { logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <header className="relative border-b border-secondary-light dark:border-secondary-dark bg-background-light dark:bg-background-dark shadow-md">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-light/10 via-primary-light/5 to-primary-light/10 pointer-events-none" />
      
      <div className="relative flex items-center justify-between p-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={onBack}
              className="group p-2 rounded-xl bg-secondary-light dark:bg-secondary-dark hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 border border-secondary-light dark:border-secondary-dark hover:border-primary-light dark:hover:border-primary-dark transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-text-light group-hover:text-primary-light dark:text-text-dark dark:group-hover:text-primary-dark transition-colors duration-200" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-light via-indigo-400 to-purple-400 bg-clip-text text-transparent dark:text-text-dark">
              {title}
            </h1>
            
            {chatPartnerStatus === 'opened' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="group p-2 rounded-xl bg-secondary-light dark:bg-secondary-dark hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 border border-secondary-light dark:border-secondary-dark hover:border-primary-light dark:hover:border-primary-dark transition-all duration-300 hover:scale-105"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors duration-200" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:text-indigo-500 transition-colors duration-200" />
            )}
          </button>

          <Link
            to="/profile"
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-light dark:bg-secondary-dark hover:bg-primary-light/20 dark:hover:bg-primary-dark/20 border border-secondary-light dark:border-secondary-dark hover:border-primary-light dark:hover:border-primary-dark transition-all duration-300 hover:scale-105"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-light group-hover:text-primary-light dark:text-text-dark dark:group-hover:text-primary-dark transition-colors duration-200" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium text-text-light group-hover:text-primary-light dark:text-text-dark dark:group-hover:text-primary-dark transition-colors duration-200">
              Profile
            </span>
          </Link>
          
          <button
            onClick={logout}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-light dark:bg-secondary-dark hover:bg-red-500/20 border border-secondary-light dark:border-secondary-dark hover:border-red-500/50 transition-all duration-300 hover:scale-105"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-text-light group-hover:text-red-400 dark:text-text-dark transition-colors duration-200" />
            <span className="hidden sm:inline text-xs sm:text-sm font-medium text-text-light group-hover:text-red-400 dark:text-text-dark transition-colors duration-200">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-light/50 to-transparent dark:via-primary-dark/50" />
    </header>
  );
};

export default Header;