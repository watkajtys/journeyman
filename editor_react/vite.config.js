import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/editor/',
  // This config ensures the built editor app goes into a subfolder of the main /public directory.
  // This allows the main game (index.html) and the editor to be served from the same Cloudflare Worker site.
  build: {
    outDir: '../public/editor',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // Default wrangler dev port
        changeOrigin: true,
      },
    },
  },
})
