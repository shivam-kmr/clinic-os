import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { readFileSync } from 'node:fs';

export default defineConfig({
  plugins: [react()],
  define: {
    // Reused by AppFooter (shared from ../frontend)
    __APP_VERSION__: JSON.stringify(
      JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')).version,
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../frontend/src'),
    },
    // Ensure we don't bundle multiple React copies when importing from ../frontend.
    // Also dedupe router packages since both this app and ../frontend import them,
    // and duplicate copies will break Router context (white page + invariant errors).
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react-router', 'react-router-dom'],
  },
  server: {
    fs: {
      // Allow importing source from the main frontend folder.
      allow: [path.resolve(__dirname, '..')],
    },
  },
});


