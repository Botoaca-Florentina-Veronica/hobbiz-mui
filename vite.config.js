import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  optimizeDeps: {
    include: ['react-slick']
  },
  build: {
    commonjsOptions: {
      include: [/react-slick/, /node_modules/]
    }
  }
});