import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Configurar Fast Refresh
      fastRefresh: true,
      // Excluir archivos de contexto del análisis estricto de Fast Refresh
      exclude: /node_modules/
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true
    }
  }
})
