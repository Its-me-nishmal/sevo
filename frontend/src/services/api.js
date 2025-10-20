import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  withCredentials: true, // Send cookies with requests
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getFriendsList = (page = 1, limit = 20) =>
  api.get(`/users/friends?page=${page}&limit=${limit}`);

export const updateProfile = (profileData) =>
  api.put('/users/profile', profileData);

export const searchUsers = (query) =>
  api.get(`/users/search?email=${query}`);

export const getUnreadMessageCounts = () =>
  api.get('/messages/unreadCounts');

export default api;