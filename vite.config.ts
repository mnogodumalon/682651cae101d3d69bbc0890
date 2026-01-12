import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({ 
  base: '/682651cae101d3d69bbc0890/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/rest': {
        target: 'https://my.living-apps.de',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/rest/, '/rest'),
      },
    },
  },
})
