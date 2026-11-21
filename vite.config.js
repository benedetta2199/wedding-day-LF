import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

const REQUIRED_ENV = ['VITE_RSVP_ENDPOINT']
const OPTIONAL_ENV = ['VITE_PHOTOS_UPLOAD_URL', 'VITE_GIFT_HOLDER', 'VITE_GIFT_IBAN']

export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    // Nel log di build (anche su Vercel) mostra quali variabili sono presenti: solo i nomi, mai i valori.
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    for (const name of [...REQUIRED_ENV, ...OPTIONAL_ENV]) {
      const ok = Boolean(env[name]?.trim())
      console.log(`[env] ${name}: ${ok ? 'presente' : 'MANCANTE'}`)
    }
    const missing = REQUIRED_ENV.filter(name => !env[name]?.trim())
    if (missing.length) {
      console.warn(`\n[env] ATTENZIONE: manca ${missing.join(', ')}. RSVP, foto e pensieri non funzioneranno.\n`)
    }
  }

  return {
    plugins: [vue()],
    build: {
      // heic-to (libheif in WebAssembly) è un file a parte, scaricato solo per l'anteprima delle foto HEIC
      // su browser che non le supportano: l'avviso sulla dimensione non serve.
      chunkSizeWarningLimit: 3500
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    }
  }
})
