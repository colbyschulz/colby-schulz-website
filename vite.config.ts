import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy /api to vercel dev (port 3000) when running vite dev standalone.
    // In normal usage, run `vercel dev` instead — it handles both together.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
