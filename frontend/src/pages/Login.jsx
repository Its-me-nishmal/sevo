import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mic, Shield, Zap, Clock, Users, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

const Login = () => {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: <Mic className="w-5 h-5" />,
      title: "Voice First",
      description: "Pure voice messaging, no typing needed"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "Self-Destruct",
      description: "Messages vanish after 3m, 3h, or 3d"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Privacy Focused",
      description: "Your conversations, truly temporary"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Instant Connect",
      description: "Real-time voice conversations"
    }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <div className="space-y-8 text-center md:text-left">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl">
                  <Mic className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sevo
              </h1>
            </div>
            
            <p className="text-lg sm:text-xl text-slate-300 font-medium">
              Speak. Don't Type. Connect with Real Voices.
            </p>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto md:mx-0">
              Experience authentic communication through voice messages that disappear.
              No screenshots, no recordings, just genuine human connection.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-400 group-hover:text-blue-300 transition-colors">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center md:justify-start gap-8 pt-4">
            <div className="text-center">
              <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white mb-1">
                <Users className="w-5 h-5 text-blue-400" />
                <span>10K+</span>
              </div>
              <p className="text-xs text-slate-400">Active Users</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-white mb-1">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <span>1M+</span>
              </div>
              <p className="text-xs text-slate-400">Voice Messages</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Card */}
        <div className="relative">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>
          
          <div className="relative bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 md:p-10 rounded-3xl shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Get Started</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Welcome Back
              </h2>
              <p className="text-slate-400">
                Sign in to start your voice journey
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={loginWithGoogle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden shadow-lg"
            >
              {/* Animated Background */}
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}></div>
              
              {/* Google Icon */}
              <div className="relative w-6 h-6 flex-shrink-0">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              </div>
              
              <span className="relative text-base sm:text-lg font-semibold text-gray-700">
                Continue with Google
              </span>
              
              <ArrowRight className={`relative w-5 h-5 text-gray-700 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-800 text-slate-400">Quick & Secure</span>
              </div>
            </div>

            {/* Security Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>Your data is encrypted and secure</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Zap className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>Instant access, no email verification needed</span>
              </div>
            </div>

            {/* Terms */}
            <p className="mt-8 text-xs text-center text-slate-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;