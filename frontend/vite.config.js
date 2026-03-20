import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      'all',
      'yamaha-milk-balanced-coaching.trycloudflare.com'
    ]
  }
})