import React from 'react';
import { ArrowLeft, LogOut, User, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, showBackButton, onBack, chatPartnerStatus }) => {
  const { logout } = useAuth();

  return (
    <header className="relative border-b border-slate-700/50 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />
      
      <div className="relative flex items-center justify-between p-4">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button 
              onClick={onBack} 
              className="group p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
              {title}
            </h1>
            
            {chatPartnerStatus === 'opened' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs font-semibold text-green-400">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Link 
            to="/profile" 
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:scale-105"
          >
            <User className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors duration-200" />
            <span className="hidden sm:inline text-sm font-medium text-slate-300 group-hover:text-blue-400 transition-colors duration-200">
              Profile
            </span>
          </Link>
          
          <button
            onClick={logout}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-red-500/20 border border-slate-700 hover:border-red-500/50 transition-all duration-300 hover:scale-105"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors duration-200" />
            <span className="hidden sm:inline text-sm font-medium text-slate-300 group-hover:text-red-400 transition-colors duration-200">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
    </header>
  );
};

export default Header;