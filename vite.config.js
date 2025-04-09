import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    rollupOptions: {
      external: [
        'react-slick',
        'slick-carousel/slick/slick.css',
        'slick-carousel/slick/slick-theme.css'
      ]
    }
  },
  optimizeDeps: {
    include: ['react-slick', 'slick-carousel']
  }
})
