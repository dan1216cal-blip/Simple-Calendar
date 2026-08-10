import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const port = Number(process.env.PORT || 3000);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'artifacts/simple-calendar/src'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
  },
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});