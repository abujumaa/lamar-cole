import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Ensures static deployment compatibility
  server: {
    host: '0.0.0.0',
    port: 5174,
  }
})
