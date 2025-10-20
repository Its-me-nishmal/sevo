import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'https://api.sevo.nichu.dev', {
  withCredentials: true,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Socket disconnected');
});

export default socket;