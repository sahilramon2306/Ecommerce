import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Existing API proxy (keep this)
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // NEW: proxy for images/uploads
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        // No rewrite needed for /uploads
      },
    },
  },
});