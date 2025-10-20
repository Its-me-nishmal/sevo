import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import api from '../services/api';
import { Camera, User, Mail, Check, X, Upload, Sparkles } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || user?.profileImage || '');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHoveringImage, setIsHoveringImage] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProfilePhoto(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    const formData = new FormData();
    if (name !== user?.name) {
      formData.append('name', name);
    }
    if (file) {
      formData.append('profilePhoto', file);
    } else if (profilePhoto && profilePhoto !== user?.profilePhoto) {
      formData.append('profilePhoto', profilePhoto);
    }

    try {
      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <Header title="Profile" showBackButton={true} onBack={() => window.history.back()} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Profile Card */}
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20"></div>
            
            {/* Content */}
            <div className="relative p-8">
              {/* Success/Error Messages */}
              {message && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-500/20 border border-green-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 font-medium">{message}</span>
                </div>
              )}
              
              {error && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 font-medium">{error}</span>
                </div>
              )}

              {/* Profile Photo Section */}
              <div className="flex flex-col items-center mb-8 pt-4">
                <div
                  className="relative group"
                  onMouseEnter={() => setIsHoveringImage(true)}
                  onMouseLeave={() => setIsHoveringImage(false)}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  
                  {/* Profile Image */}
                  <div className="relative">
                    <img
                      src={profilePhoto || user?.profilePhoto || user?.profileImage || 'https://via.placeholder.com/150'}
                      alt="Profile"
                      className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-slate-700 group-hover:border-blue-500 transition-all duration-300 shadow-xl"
                    />
                    
                    {/* Camera Overlay */}
                    <div className={`absolute inset-0 rounded-full bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHoveringImage ? 'opacity-100' : 'opacity-0'}`}>
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  {/* Upload Button */}
                  <label
                    htmlFor="profilePhotoUpload"
                    className="absolute -bottom-2 -right-2 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-blue-500/50 border-2 border-slate-800"
                  >
                    <Upload className="w-4 h-4" />
                  </label>
                  <input
                    type="file"
                    id="profilePhotoUpload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <p className="mt-4 text-xs sm:text-sm text-slate-400 text-center">
                  Click the upload button to change your photo
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                {/* Email Field (Read-only) */}
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-900/30 border border-slate-700/50 text-slate-400 cursor-not-allowed"
                    value={user?.email || 'Not available'}
                    disabled
                  />
                  <p className="mt-2 text-xs text-slate-500">Email cannot be changed</p>
                </div>

                {/* Account Info */}
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs sm:text-sm font-semibold text-slate-300">Account Information</h3>
                  </div>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account ID:</span>
                      <span className="text-slate-300 font-mono">{user?._id?.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Member Since:</span>
                      <span className="text-slate-300">{new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 h-10 sm:h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-blue-500/50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-blue-500/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">Pro Tip</h4>
                <p className="text-xs text-slate-400">
                  Use a clear profile photo to help your friends recognize you easily.
                  Your name will be visible in all voice conversations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;