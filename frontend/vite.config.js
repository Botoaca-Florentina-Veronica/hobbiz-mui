import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Încarcă variabilele de mediu bazate pe `mode` (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    publicDir: 'public',
    optimizeDeps: {
      include: ['react-slick']
    },
    build: {
      assetsInclude: ['**/*.{jpg,jpeg,png,webp,svg}'],
      commonjsOptions: {
        include: [/react-slick/, /node_modules/]
      },
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]'
        },
        external: ['jwt-decode']
      }
    },
    // Definirea variabilelor de mediu pentru a fi accesibile în cod
    define: {
      'process.env': env // Permite accesul la toate variabilele cu prefixul VITE_
    }
  };
});