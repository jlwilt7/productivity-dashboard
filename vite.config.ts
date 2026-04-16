import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// For GitHub Pages project sites, set VITE_BASE to "/<repo-name>/" at build time,
// or rely on the default "/" for user/organization sites and custom domains.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
  },
});
