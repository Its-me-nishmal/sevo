import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    WAPID_PUBLIC_API_KEY: JSON.stringify(
      'BHDPjn_pm3c4YfJYUC2iNc9T9Vm16RWVuBDJBvOsU4q4PEvZkrTPJ-CIUHw3xhwiLMSTPlAeGJwEU2-UJch8l1c'
    ),
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'https://api.sevo.nichu.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'https://api.sevo.nichu.dev',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
