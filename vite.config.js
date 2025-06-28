import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// En ESM no existe __dirname, así que lo reconstruimos:
const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig({
  plugins: [
    react(),
    // ...otros plugins
  ],
  resolve: {
    alias: {
      '@':       path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    }
  },
  root: path.resolve(__dirname, 'client'),
  build: {
    // Directorio donde Vite volcará la build de producción
    outDir: path.resolve(__dirname, 'server', 'public'),
    emptyOutDir: true,
  },
  server: {
    // Definir el puerto de desarrollo para que coincida con tu cliente (opcional)
    port: 3000,
    fs: {
      strict: true,
      deny: ['**/.*'],
    },
    proxy: {
      // Redirigir llamadas a /api al backend de Express en el puerto 5000
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
