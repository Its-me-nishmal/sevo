import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 👈 allows LAN access (0.0.0.0)
    port: 5173, // optional, ensures consistent port
    proxy: {
      '/uploads': {
        target: 'https://api.sevo.nichu.dev', // backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
