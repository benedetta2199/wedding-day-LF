import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // heic-to (libheif in WebAssembly) è un file a parte, scaricato solo per l'anteprima delle foto HEIC
    // su browser che non le supportano: l'avviso sulla dimensione non serve.
    chunkSizeWarningLimit: 3500
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
