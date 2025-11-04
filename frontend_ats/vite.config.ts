import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Auth server (signin/signup)
      '/api/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Flask backend endpoints
      '/api/cv': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/user': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/jobs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/applications': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/admin': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
