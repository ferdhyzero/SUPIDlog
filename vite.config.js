import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './', // Uses relative asset paths so it works seamlessly under subfolders (XAMPP /dist) or tunnels
  plugins: [react()],
  server: {
    host: true, // Enables local network access (http://<IP-LAPTOP>:5173) for smartphones
    allowedHosts: true, // Allows localtunnel / external hosts (e.g. .loca.lt) to bypass Vite 8 host security
    proxy: {
      '/api': {
        target: 'http://localhost/SUPIDlog',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost/SUPIDlog',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
