import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_HOST || 'localhost',
    port: 5173,
    proxy: {
      // Проксируем /api/* на Django — локально localhost:8000, в Docker — backend:8000
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/media': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
