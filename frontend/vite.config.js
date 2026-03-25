import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/accounts': { target: apiTarget, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/accounts': { target: apiTarget, changeOrigin: true },
    },
  },
})
