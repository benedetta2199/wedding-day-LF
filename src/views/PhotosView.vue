<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { wedding } from '@/config/wedding'
import { fetchPhotos, uploadPhoto } from '@/lib/rsvpApi'

const { uploadUrl, perPage, maxUploadMb } = wedding.photos

const photos = ref([])
const status = ref('loading') // loading | ready | error | not_configured
const shown = ref(perPage)
const visible = computed(() => photos.value.slice(0, shown.value))

// Anteprime servite da Drive (la cartella deve essere visibile a chi ha il link)
const thumb = (id, width) => `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
const driveLink = id => `https://drive.google.com/file/d/${id}/view`

// silent: aggiorna senza mostrare i segnaposto (dopo un caricamento)
async function load(silent = false) {
  if (!silent) status.value = 'loading'
  try {
    photos.value = await fetchPhotos()
    status.value = 'ready'
  } catch (error) {
    status.value = error.message === 'not_configured' ? 'not_configured' : 'error'
  }
}

// ---------- Caricamento dal sito ----------
// Ogni file viene inviato all'Apps Script, che lo salva nella cartella Drive.
const guest = ref(loadGuest())
const queue = ref([]) // { key, name, file, status: waiting | uploading | done | error | too_big | wrong_type }
const uploading = computed(() => queue.value.some(i => i.status === 'waiting' || i.status === 'uploading'))
const doneCount = computed(() => queue.value.filter(i => i.status === 'done').length)
const failed = computed(() => queue.value.filter(i => i.status === 'error'))

function loadGuest() {
  try { return localStorage.getItem('foto-ospite') || '' } catch { return '' }
}

const statusLabel = {
  waiting: 'In attesa',
  uploading: 'Caricamento…',
  done: 'Caricata',
  error: 'Non riuscita',
  too_big: `Oltre ${maxUploadMb} MB`,
  wrong_type: 'Non è una foto o un video'
}

let nextKey = 0
function onFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = '' // permette di riscegliere gli stessi file
  if (!files.length) return
  try { localStorage.setItem('foto-ospite', guest.value.trim()) } catch {}

  // tolgo dall'elenco quelli già finiti, così resta leggibile
  queue.value = queue.value.filter(i => i.status !== 'done')
  for (const file of files) {
    const isMedia = /^(image|video)\//.test(file.type) || /\.(heic|heif)$/i.test(file.name)
    const status = !isMedia ? 'wrong_type' : file.size > maxUploadMb * 1024 * 1024 ? 'too_big' : 'waiting'
    queue.value.push({ key: nextKey++, name: file.name, file, status })
  }
  runQueue()
}

function retryFailed() {
  failed.value.forEach(i => (i.status = 'waiting'))
  runQueue()
}

// Due file alla volta: più veloce, senza sovraccaricare l'Apps Script
let running = 0
const PARALLEL = 2
function runQueue() {
  while (running < PARALLEL) {
    const item = queue.value.find(i => i.status === 'waiting')
    if (!item) break
    running++
    item.status = 'uploading'
    uploadPhoto(item.file, guest.value.trim())
      .then(() => {
        item.status = 'done'
        item.file = null
      })
      .catch(() => (item.status = 'error'))
      .finally(() => {
        running--
        if (uploading.value) runQueue()
        else load(true) // finito tutto: la galleria mostra le nuove foto
      })
  }
}

// Avviso se si chiude la pagina durante il caricamento
const onBeforeUnload = e => {
  if (uploading.value) e.preventDefault()
}

// ---------- Visualizzatore a schermo intero ----------
const dialog = ref(null)
const current = ref(-1)
const active = computed(() => photos.value[current.value])

function open(index) {
  current.value = index
  dialog.value?.showModal()
}

function step(delta) {
  const total = photos.value.length
  current.value = (current.value + delta + total) % total
  // se si scorre oltre le foto mostrate, la griglia le carica
  if (current.value >= shown.value) shown.value = current.value + 1
}

function onKey(e) {
  if (!dialog.value?.open) return
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}

// Scorrimento con il dito sul telefono
let touchX = null
const onTouchStart = e => (touchX = e.touches[0].clientX)
function onTouchEnd(e) {
  if (touchX === null) return
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
  touchX = null
}

// Click sullo sfondo scuro: chiude
function onDialogClick(e) {
  if (e.target === dialog.value) dialog.value.close()
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
  window.addEventListener('beforeunload', onBeforeUnload)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('beforeunload', onBeforeUnload)
})
</script>

<template>
  <main class="page photos-page">
    <section class="photos-intro">
      <div class="container">
        <div class="section-head">
          <span class="section-index">Foto</span>
          <h1>I vostri scatti</h1>
          <p>Ogni foto racconta un pezzo della giornata. Condividete le vostre: le raccogliamo tutte qui.</p>
        </div>

        <div v-reveal class="upload-card">
          <span class="upload-seal" aria-hidden="true"><AppIcon name="camera" :size="26" /></span>
          <h2>Carica le tue foto</h2>
          <p>Scegliete foto e video dal telefono: finiscono direttamente nel nostro album, senza bisogno di account.</p>

          <div class="guest-field">
            <label for="foto-ospite">Il tuo nome <span>(facoltativo)</span></label>
            <input
              id="foto-ospite"
              v-model="guest"
              type="text"
              maxlength="60"
              autocomplete="name"
              placeholder="Così sappiamo chi ringraziare"
            >
          </div>

          <label class="btn primary upload-button">
            <AppIcon name="upload" :size="20" />Scegli le foto
            <input class="sr-only" type="file" accept="image/*,video/*" multiple @change="onFiles">
          </label>

          <div v-if="queue.length" class="upload-status">
            <p class="upload-summary" role="status">
              <template v-if="uploading">Caricamento: {{ doneCount }} di {{ queue.length }}. Non chiudere la pagina.</template>
              <template v-else-if="doneCount === queue.length">Grazie! {{ doneCount === 1 ? 'Foto caricata' : `${doneCount} foto caricate` }}.</template>
              <template v-else>Caricate {{ doneCount }} di {{ queue.length }}.</template>
            </p>
            <ul class="upload-list">
              <li v-for="item in queue" :key="item.key" :class="`is-${item.status}`">
                <span class="upload-name">{{ item.name }}</span>
                <span class="upload-state">
                  <AppIcon v-if="item.status === 'done'" name="check" :size="16" />
                  {{ statusLabel[item.status] }}
                </span>
              </li>
            </ul>
            <button v-if="failed.length && !uploading" class="link-button" type="button" @click="retryFailed">
              Riprova quelle non riuscite
            </button>
          </div>

          <p v-if="uploadUrl" class="upload-alt">
            Video oltre {{ maxUploadMb }} MB?
            <a :href="uploadUrl" target="_blank" rel="noopener noreferrer">Caricali su Google Drive</a>
          </p>
        </div>
      </div>
    </section>

    <section class="photos-gallery" aria-labelledby="titolo-galleria">
      <div class="container">
        <div class="gallery-head">
          <h2 id="titolo-galleria">La galleria</h2>
          <p v-if="status === 'ready' && photos.length" class="gallery-count">
            <span class="num">{{ photos.length }}</span> foto
          </p>
          <button
            class="chip-link refresh"
            type="button"
            :disabled="status === 'loading'"
            @click="load()"
          >
            <AppIcon name="refresh" :size="16" />Aggiorna
          </button>
        </div>

        <!-- Caricamento: riquadri segnaposto -->
        <ul v-if="status === 'loading'" class="grid" aria-busy="true" aria-label="Caricamento delle foto">
          <li v-for="n in 8" :key="n" class="tile skeleton"></li>
        </ul>

        <p v-else-if="status === 'error'" class="gallery-message" role="alert">
          Non riusciamo a caricare le foto in questo momento.
          <button class="link-button" type="button" @click="load()">Riprova</button>
        </p>

        <p v-else-if="status === 'not_configured'" class="gallery-message">
          La galleria sarà disponibile a breve.
        </p>

        <p v-else-if="!photos.length" class="gallery-message">
          Ancora nessuna foto: la prima potrebbe essere la vostra!
        </p>

        <template v-else>
          <ul class="grid">
            <li v-for="(photo, index) in visible" :key="photo.id" class="tile">
              <a
                v-if="photo.v"
                :href="driveLink(photo.id)"
                target="_blank"
                rel="noopener noreferrer"
                class="tile-button"
                aria-label="Guarda il video su Google Drive"
              >
                <img :src="thumb(photo.id, 600)" alt="" loading="lazy" referrerpolicy="no-referrer">
                <span class="play" aria-hidden="true"><AppIcon name="play" :size="18" /></span>
              </a>
              <button
                v-else
                type="button"
                class="tile-button"
                :aria-label="`Apri la foto ${index + 1} di ${photos.length}`"
                @click="open(index)"
              >
                <img :src="thumb(photo.id, 600)" alt="" loading="lazy" referrerpolicy="no-referrer">
              </button>
            </li>
          </ul>

          <div v-if="shown < photos.length" class="more">
            <button class="btn" type="button" @click="shown += perPage">Mostra altre</button>
          </div>
        </template>
      </div>
    </section>

    <dialog
      ref="dialog"
      class="viewer"
      aria-label="Foto a schermo intero"
      @click="onDialogClick"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <template v-if="active">
        <img
          :key="active.id"
          class="viewer-img"
          :src="thumb(active.id, 1600)"
          :alt="`Foto ${current + 1} di ${photos.length}`"
          referrerpolicy="no-referrer"
        >
        <div class="viewer-bar">
          <span class="num">{{ current + 1 }} / {{ photos.length }}</span>
          <a :href="driveLink(active.id)" target="_blank" rel="noopener noreferrer">
            Originale<AppIcon name="external" :size="15" />
          </a>
        </div>
      </template>
      <button class="viewer-btn close" type="button" aria-label="Chiudi" @click="dialog.close()">
        <AppIcon name="close" />
      </button>
      <button v-if="photos.length > 1" class="viewer-btn prev" type="button" aria-label="Foto precedente" @click="step(-1)">
        <AppIcon name="chevron" />
      </button>
      <button v-if="photos.length > 1" class="viewer-btn next" type="button" aria-label="Foto successiva" @click="step(1)">
        <AppIcon name="chevron" />
      </button>
    </dialog>
  </main>
</template>

<style scoped>
.photos-page {
  background: var(--glow) top / 100% 640px no-repeat, var(--foglia);
}

.photos-intro {
  padding: 40px 0 56px;
}

/* ---------- Scheda di caricamento ---------- */
.upload-card {
  position: relative;
  max-width: 640px;
  margin: 48px auto 0;
  padding: 52px 24px 32px;
  border: 1px solid rgba(107, 113, 72, .28);
  border-radius: 32px;
  background: var(--carta);
  box-shadow: 0 28px 60px -40px rgba(46, 50, 34, .45);
  text-align: center;
}

.upload-seal {
  position: absolute;
  top: 0;
  left: 50%;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 5px solid var(--carta);
  border-radius: 50%;
  background: var(--erba);
  color: var(--carta);
  box-shadow: 0 0 0 1px rgba(107, 113, 72, .28);
  transform: translate(-50%, -50%);
}

.upload-card h2 {
  font-size: clamp(2rem, 8vw, 2.75rem);
}

.upload-card p {
  max-width: 30rem;
  margin: 10px auto 24px;
  color: var(--oliva-soft);
}

.guest-field {
  display: grid;
  gap: 6px;
  max-width: 360px;
  margin: 0 auto 20px;
  font-weight: 500;
  text-align: left;
}

.guest-field span {
  font-weight: 400;
  color: var(--oliva-soft);
}

.guest-field input {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--foglia);
  font-weight: 400;
}

.guest-field input:focus {
  border-color: var(--oliva);
  outline: none;
}

/* l'input file è nascosto: si clicca l'etichetta-pulsante */
.upload-button:has(input:focus-visible) {
  outline: 2px solid var(--fede-ink);
  outline-offset: 3px;
}

.upload-status {
  max-width: 460px;
  margin: 24px auto 0;
  text-align: left;
}

.upload-card .upload-summary {
  margin: 0 0 8px;
  font-weight: 500;
  color: var(--oliva);
}

.upload-list {
  max-height: 240px;
  overflow-y: auto;
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  font-size: .9375rem;
}

.upload-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

.upload-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-state {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  color: var(--oliva-soft);
}

.is-done .upload-state {
  color: var(--erba);
}

.is-error .upload-state,
.is-too_big .upload-state,
.is-wrong_type .upload-state {
  color: #9a3b2a;
}

.is-uploading .upload-state {
  animation: pulse 1.4s ease-in-out infinite;
}

.upload-card .upload-alt {
  margin: 24px auto 0;
  font-size: .9375rem;
}

.upload-alt a {
  color: var(--oliva);
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* ---------- Galleria ---------- */
.photos-gallery {
  padding: 56px 0 96px;
  background: var(--verde-chiaro);
}

.gallery-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 16px;
  margin-bottom: 24px;
}

.gallery-head h2 {
  font-size: clamp(2.25rem, 9vw, 3rem);
}

.gallery-count {
  color: var(--oliva-soft);
}

.refresh {
  margin-left: auto;
  background: var(--carta);
}

.refresh:disabled {
  opacity: .5;
  cursor: default;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.tile {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 10px;
  background: var(--salvia);
}

.tile-button {
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: none;
}

.tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .4s var(--ease);
}

.tile-button:hover img {
  transform: scale(1.04);
}

.play {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(46, 50, 34, .7);
  color: var(--carta);
}

.skeleton {
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  50% { opacity: .55; }
}

.gallery-message {
  padding: 48px 0;
  text-align: center;
  color: var(--oliva-soft);
}

.link-button {
  padding: 0;
  border: 0;
  background: none;
  font-weight: 500;
  color: var(--oliva);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.more {
  margin-top: 32px;
  text-align: center;
}

.more .btn {
  background: var(--carta);
}

/* ---------- Visualizzatore ---------- */
.viewer {
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(30, 32, 22, .94);
  color: var(--carta);
}

.viewer[open] {
  display: grid;
  place-items: center;
}

.viewer::backdrop {
  background: transparent;
}

.viewer-img {
  max-width: 100%;
  max-height: calc(100dvh - 120px);
  object-fit: contain;
}

.viewer-bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px max(16px, env(safe-area-inset-bottom));
  font-size: .9375rem;
}

.viewer-bar a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.viewer-btn {
  position: absolute;
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border: 0;
  border-radius: 50%;
  background: rgba(251, 248, 241, .12);
  color: var(--carta);
  transition: background-color .2s;
}

.viewer-btn:hover {
  background: rgba(251, 248, 241, .24);
}

.close {
  top: 12px;
  right: 12px;
}

.prev,
.next {
  top: 50%;
  margin-top: -24px;
}

.prev {
  left: 12px;
  transform: scaleX(-1);
}

.next {
  right: 12px;
}

@media (min-width: 600px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .upload-card {
    padding: 60px 48px 40px;
  }
}

@media (min-width: 960px) {
  .photos-intro {
    padding: 72px 0 80px;
  }

  .photos-gallery {
    padding: 96px 0 128px;
  }

  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
  }

  .tile {
    border-radius: 14px;
  }

  .prev { left: 24px; }
  .next { right: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
  .tile img { transition: none; }
}
</style>
