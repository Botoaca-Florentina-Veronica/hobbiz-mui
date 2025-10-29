import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Încarcă variabilele de mediu bazate pe `mode` (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
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
        }
      }
    }
  };
});