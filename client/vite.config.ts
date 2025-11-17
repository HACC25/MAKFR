import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
 export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { // Any request starting with /api will be proxied
        target: 'http://localhost:3000', // Your backend API's address
        changeOrigin: true, // Needed for virtual hosted sites
        // Don't rewrite the path - keep /api in the URL
      },
    },
  },
});