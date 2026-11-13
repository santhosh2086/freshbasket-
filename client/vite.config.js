import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // dev: forward /api to the Express server so no CORS setup is needed
    proxy: { '/api': 'http://localhost:5000' },
  },
});
