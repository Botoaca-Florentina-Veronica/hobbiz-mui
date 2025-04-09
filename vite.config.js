import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  optimizeDeps: {
    include: ['react-slick']
  },
  build: {
    assetsInclude: ['**/*.{jpg,jpeg,png,webp,svg}'], // Include toate formatele
    commonjsOptions: {
      include: [/react-slick/, /node_modules/]
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]' // Organizare automata
      }
    }
  }
});