<script setup>
// Scheda "Condividi" della pagina /foto: tre modi per partecipare.
//   foto      → più foto e video insieme
//   polaroid  → una foto con una dedica breve (in galleria diventa una polaroid)
//   pensiero  → solo testo
// Emette `refresh` quando ci sono nuove foto in Drive e `message` con il pensiero appena salvato.
import { ref, computed, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { wedding } from '@/config/wedding'
import { uploadPhoto, sendMessage } from '@/lib/rsvpApi'
import { previewFor } from '@/lib/imagePreview'
import { compressImage, isCompressible } from '@/lib/compressImage'

const emit = defineEmits(['refresh', 'message'])
const { uploadUrl, maxUploadMb, maxMessageLength, maxCaptionLength, prompts } = wedding.photos
const MAX_BYTES = maxUploadMb * 1024 * 1024

const modes = [
  { id: 'foto', label: 'Foto', icon: 'camera', title: 'Carica le tue foto', text: 'Scegliete foto e video dal telefono: finiscono direttamente nel nostro album, senza bisogno di account.' },
  { id: 'polaroid', label: 'Con dedica', icon: 'image', title: 'Una foto, due parole', text: 'Scegliete uno scatto e scriveteci sotto una dedica breve: in galleria diventerà una polaroid.' },
  { id: 'pensiero', label: 'Pensiero', icon: 'pen', title: 'Scrivi agli sposi', text: 'Un augurio, un ricordo, una dedica: il vostro pensiero comparirà tra le foto.' }
]
const mode = ref('foto')
const current = computed(() => modes.find(m => m.id === mode.value))

// ---------- Nome (ricordato sul dispositivo) ----------
const guest = ref(readGuest())
function readGuest() {
  try { return localStorage.getItem('foto-ospite') || '' } catch { return '' }
}
function saveGuest() {
  try { localStorage.setItem('foto-ospite', guest.value.trim()) } catch {}
}

const isMedia = file => /^(image|video)\//.test(file.type) || /\.(heic|heif)$/i.test(file.name)
const isImage = file => /^image\//.test(file.type) || /\.(heic|heif)$/i.test(file.name)

// ---------- Foto: più file, due alla volta ----------
const queue = ref([]) // { key, name, file, preview, status }
const uploading = computed(() => queue.value.some(i => ['waiting', 'compressing', 'uploading'].includes(i.status)))
const doneCount = computed(() => queue.value.filter(i => i.status === 'done').length)
const failed = computed(() => queue.value.filter(i => i.status === 'error'))
const dragging = ref(false)

const statusLabel = {
  waiting: 'In attesa',
  compressing: 'Ottimizzo…',
  uploading: 'Caricamento…',
  done: 'Caricata',
  error: 'Non riuscita',
  too_big: `Oltre ${maxUploadMb} MB`,
  wrong_type: 'Non è una foto'
}

let nextKey = 0
function addFiles(list) {
  const files = Array.from(list || [])
  if (!files.length) return
  saveGuest()
  // via dall'elenco quelli già caricati, così resta leggibile
  queue.value.filter(i => i.status === 'done').forEach(i => i.preview && URL.revokeObjectURL(i.preview))
  queue.value = queue.value.filter(i => i.status !== 'done')

  for (const file of files) {
    // oltre il limite si scarta subito solo se la compressione non può aiutare
    const status = !isMedia(file) ? 'wrong_type' : file.size > MAX_BYTES && !isCompressible(file) ? 'too_big' : 'waiting'
    const item = { key: nextKey++, name: file.name, file, preview: null, status, saved: 0 }
    queue.value.push(item)
    // anteprima in arrivo (le HEIC vanno convertite): il caricamento non la aspetta
    if (isImage(file)) {
      previewFor(file).then(url => {
        const live = queue.value.find(i => i.key === item.key)
        if (live) live.preview = url
        else if (url) URL.revokeObjectURL(url)
      })
    }
  }
  runQueue()
}

function onPick(e) {
  addFiles(e.target.files)
  e.target.value = '' // permette di riscegliere gli stessi file
}

function onDrop(e) {
  dragging.value = false
  addFiles(e.dataTransfer?.files)
}

function retryFailed() {
  failed.value.forEach(i => (i.status = 'waiting'))
  runQueue()
}

let running = 0
function runQueue() {
  while (running < 2) {
    const item = queue.value.find(i => i.status === 'waiting')
    if (!item) break
    running++
    item.status = 'compressing'
    prepare(item.file)
      .then(({ file, takenAt }) => {
        if (file.size > MAX_BYTES) throw Object.assign(new Error('too_big'), { tooBig: true })
        item.saved = savedPercent(item.file, file)
        item.status = 'uploading'
        return uploadPhoto(file, guest.value.trim(), '', takenAt)
      })
      .then(() => {
        item.status = 'done'
        item.file = null
      })
      .catch(error => (item.status = error.tooBig ? 'too_big' : 'error'))
      .finally(() => {
        running--
        if (uploading.value) runQueue()
        else emit('refresh')
      })
  }
}

// Compressione senza perdita di risoluzione (JPEG ricompressi, HEIC → WebP; vedi compressImage.js).
// Restituisce { file, takenAt }.
const prepare = file => compressImage(file)
const savedPercent = (before, after) => Math.max(0, Math.round((1 - after.size / before.size) * 100))

// ---------- Polaroid: una foto + dedica ----------
const polaroid = ref(null) // { file, preview (URL o null), loading }
const caption = ref('')
const polaroidState = ref('idle') // idle | sending | sent | error | too_big
const captionLeft = computed(() => maxCaptionLength - caption.value.length)

function pickPolaroid(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (polaroid.value?.preview) URL.revokeObjectURL(polaroid.value.preview)
  const current = { file, preview: null, loading: true }
  polaroid.value = current
  polaroidState.value = file.size > MAX_BYTES && !isCompressible(file) ? 'too_big' : 'idle'
  previewFor(file).then(url => {
    // l'ospite potrebbe aver già scelto un'altra foto
    if (polaroid.value?.file !== file) {
      if (url) URL.revokeObjectURL(url)
      return
    }
    polaroid.value = { ...polaroid.value, preview: url, loading: false }
  })
}

async function sendPolaroid() {
  if (!polaroid.value || polaroidState.value === 'sending' || polaroidState.value === 'too_big') return
  saveGuest()
  polaroidState.value = 'sending'
  const dedica = caption.value.trim()
  try {
    const { file, takenAt } = await prepare(polaroid.value.file)
    if (file.size > MAX_BYTES) {
      polaroidState.value = 'too_big'
      return
    }
    const result = await uploadPhoto(file, guest.value.trim(), dedica, takenAt)
    if (polaroid.value.preview) URL.revokeObjectURL(polaroid.value.preview)
    polaroid.value = null
    caption.value = ''
    // Foto salvata ma dedica no: succede se l'Apps Script pubblicato è una versione vecchia
    polaroidState.value = dedica && !result.message ? 'caption_lost' : 'sent'
    emit('refresh')
  } catch {
    polaroidState.value = 'error'
  }
}

// ---------- Pensiero ----------
const text = ref('')
const sending = ref('idle') // idle | sending | sent | error
const remaining = computed(() => maxMessageLength - text.value.length)
const textarea = ref(null)

async function submitMessage() {
  const testo = text.value.trim()
  if (!testo || sending.value === 'sending') return
  saveGuest()
  sending.value = 'sending'
  try {
    emit('message', await sendMessage(guest.value.trim(), testo))
    text.value = ''
    hint.value = null
    sending.value = 'sent'
  } catch {
    sending.value = 'error'
  }
}

// Suggerimenti: uno spunto diverso a ogni clic, senza ripetizioni finché non si sono visti tutti
const hint = ref(null)
let deck = []
function nextHint() {
  if (!deck.length) {
    deck = prompts.map((_, i) => i).sort(() => Math.random() - 0.5)
    if (hint.value && prompts[deck[0]] === hint.value && deck.length > 1) deck.push(deck.shift())
  }
  hint.value = prompts[deck.shift()]
}

function useHint() {
  const start = hint.value.inizio
  const before = text.value.trimEnd()
  text.value = (before ? before + '\n' : '') + start
  sending.value = 'idle'
  hint.value = null
  requestAnimationFrame(() => {
    const el = textarea.value
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  })
}

// Avviso se si chiude la pagina con un invio in corso
const busy = computed(() => uploading.value || sending.value === 'sending' || polaroidState.value === 'sending')
const onBeforeUnload = e => busy.value && e.preventDefault()
window.addEventListener('beforeunload', onBeforeUnload)
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  queue.value.forEach(i => i.preview && URL.revokeObjectURL(i.preview))
  if (polaroid.value?.preview) URL.revokeObjectURL(polaroid.value.preview)
})
</script>

<template>
  <div class="share-card">
    <span class="seal" aria-hidden="true"><AppIcon :name="current.icon" :size="26" /></span>

    <div class="switch" role="group" aria-label="Cosa vuoi condividere">
      <button
        v-for="m in modes"
        :key="m.id"
        type="button"
        :aria-pressed="mode === m.id"
        @click="mode = m.id"
      >
        <AppIcon :name="m.icon" :size="18" /><span>{{ m.label }}</span>
      </button>
    </div>

    <h2>{{ current.title }}</h2>
    <p class="lead">{{ current.text }}</p>

    <div class="field">
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

    <!-- ===== Foto ===== -->
    <div v-if="mode === 'foto'" class="panel">
      <label
        class="dropzone"
        :class="{ dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <input class="sr-only" type="file" accept="image/*,video/*" multiple @change="onPick">
        <span class="drop-icon" aria-hidden="true"><AppIcon name="upload" :size="24" /></span>
        <span class="drop-copy">
          <strong class="drop-title">
            <span class="on-touch">Scegli foto e video</span>
            <span class="on-pointer">Trascina qui foto e video</span>
          </strong>
          <span class="drop-hint">
            <span class="on-touch">Dalla galleria o dalla fotocamera · </span>fino a {{ maxUploadMb }} MB ciascuno
          </span>
        </span>
        <span class="btn primary drop-button on-pointer">Scegli dal computer</span>
        <span class="drop-arrow on-touch" aria-hidden="true"><AppIcon name="chevron" :size="20" /></span>
      </label>

      <div v-if="queue.length" class="queue">
        <p class="queue-summary" role="status">
          <template v-if="uploading">Caricamento: {{ doneCount }} di {{ queue.length }}. Non chiudere la pagina.</template>
          <template v-else-if="doneCount === queue.length">Grazie! {{ doneCount === 1 ? 'Foto caricata' : `${doneCount} foto caricate` }}.</template>
          <template v-else>Caricate {{ doneCount }} di {{ queue.length }}.</template>
        </p>
        <ul class="queue-list">
          <li v-for="item in queue" :key="item.key" :class="`is-${item.status}`">
            <span class="queue-thumb">
              <img v-if="item.preview" :src="item.preview" alt="" @error="item.preview = null">
              <AppIcon v-else name="camera" :size="18" />
            </span>
            <span class="queue-name">{{ item.name }}</span>
            <span class="queue-state">
              <AppIcon v-if="item.status === 'done'" name="check" :size="16" />
              {{ statusLabel[item.status] }}<template v-if="item.status === 'done' && item.saved"> · −{{ item.saved }}%</template>
            </span>
          </li>
        </ul>
        <button v-if="failed.length && !uploading" class="text-link" type="button" @click="retryFailed">
          Riprova quelle non riuscite
        </button>
      </div>

      <p v-if="uploadUrl" class="alt-link">
        Video più grandi di {{ maxUploadMb }} MB?
        <a :href="uploadUrl" target="_blank" rel="noopener noreferrer">Caricali su Google Drive</a>
      </p>
    </div>

    <!-- ===== Foto con dedica: anteprima a forma di polaroid ===== -->
    <form v-else-if="mode === 'polaroid'" class="panel" @submit.prevent="sendPolaroid">
      <div class="composer">
        <div class="polaroid-card" :class="{ empty: !polaroid }">
          <label class="polaroid-photo">
            <input class="sr-only" type="file" accept="image/*" @change="pickPolaroid">
            <img v-if="polaroid?.preview" :src="polaroid.preview" alt="Anteprima della foto scelta">
            <span v-else-if="polaroid?.loading" class="polaroid-placeholder" role="status">
              <span class="spinner" aria-hidden="true"></span>Preparo l’anteprima…
            </span>
            <span v-else-if="polaroid" class="polaroid-placeholder">
              <AppIcon name="image" :size="30" />Foto pronta per l’invio
            </span>
            <span v-else class="polaroid-placeholder">
              <AppIcon name="camera" :size="30" />Tocca per scegliere la foto
            </span>
            <span v-if="polaroid" class="polaroid-change">Cambia foto</span>
          </label>
          <div class="polaroid-strip">
            <label class="sr-only" for="dedica">Dedica</label>
            <textarea
              id="dedica"
              v-model="caption"
              rows="2"
              :maxlength="maxCaptionLength"
              placeholder="Scrivi qui la tua dedica…"
              @input="polaroidState === 'sent' && (polaroidState = 'idle')"
            ></textarea>
            <span class="polaroid-sign">
              <span v-if="guest.trim()">{{ guest.trim() }}</span>
              <span class="num" :class="{ low: captionLeft < 20 }">{{ captionLeft }}</span>
            </span>
          </div>
        </div>
      </div>

      <button
        class="btn primary"
        type="submit"
        :disabled="!polaroid || polaroidState === 'sending' || polaroidState === 'too_big'"
      >
        <AppIcon name="upload" :size="20" />{{ polaroidState === 'sending' ? 'Invio…' : 'Invia la polaroid' }}
      </button>
      <p v-if="polaroidState === 'sent'" class="feedback" role="status">Grazie! La tua polaroid è nella galleria.</p>
      <p v-else-if="polaroidState === 'error'" class="feedback is-error" role="alert">Non siamo riusciti a inviarla. Riprova tra poco.</p>
      <p v-else-if="polaroidState === 'too_big'" class="feedback is-error" role="alert">La foto supera i {{ maxUploadMb }} MB: scegline un'altra.</p>
      <p v-else-if="polaroidState === 'caption_lost'" class="feedback is-error" role="alert">
        La foto è arrivata, ma la dedica non è stata salvata. Riprova più tardi.
      </p>
    </form>

    <!-- ===== Pensiero ===== -->
    <form v-else class="panel" @submit.prevent="submitMessage">
      <div class="field">
        <div class="field-row">
          <label for="pensiero">Il tuo pensiero</label>
          <button class="hint-button" type="button" aria-controls="spunto" @click="nextHint">
            <AppIcon name="lightbulb" :size="16" />{{ hint ? 'Un altro' : 'Suggerimento' }}
          </button>
        </div>

        <div v-if="hint" id="spunto" class="hint" aria-live="polite">
          <p class="hint-question">{{ hint.domanda }}</p>
          <div class="hint-actions">
            <button type="button" class="hint-use" @click="useHint">
              Usa questo inizio: <em>“{{ hint.inizio.trim() }}…”</em>
            </button>
            <button type="button" class="hint-close" aria-label="Chiudi il suggerimento" @click="hint = null">
              <AppIcon name="close" :size="16" />
            </button>
          </div>
        </div>

        <div class="textarea-wrap">
          <textarea
            id="pensiero"
            ref="textarea"
            v-model="text"
            rows="5"
            :maxlength="maxMessageLength"
            required
            :placeholder="`Cari ${wedding.couple.join(' e ')}…`"
            @input="sending === 'sent' && (sending = 'idle')"
          ></textarea>
          <span class="counter num" :class="{ low: remaining < 50 }">{{ remaining }}</span>
        </div>
      </div>

      <button class="btn primary" type="submit" :disabled="!text.trim() || sending === 'sending'">
        <AppIcon name="heart" :size="20" />{{ sending === 'sending' ? 'Invio…' : 'Invia il pensiero' }}
      </button>
      <p v-if="sending === 'sent'" class="feedback" role="status">Grazie! Il tuo pensiero è nella galleria qui sotto.</p>
      <p v-else-if="sending === 'error'" class="feedback is-error" role="alert">Non siamo riusciti a inviarlo. Riprova tra poco.</p>
    </form>
  </div>
</template>

<style scoped>
/* Scheda a "foglia" come quella del regalo in home: angoli alternati, cerchi oro negli angoli */
.share-card {
  position: relative;
  max-width: 680px;
  /* sul telefono la scheda guadagna qualche pixel sui lati */
  margin: 0 calc(var(--gutter) * -.4);
  padding: 46px 16px 28px;
  border: 1px solid rgba(128, 96, 58, .42);
  border-radius: 40px 14px 40px 14px;
  background: rgba(251, 248, 241, .96);
  box-shadow: 0 28px 70px -36px rgba(46, 50, 34, .4);
  text-align: center;
}

/* il contenuto sta sopra i cerchi decorativi (il sigillo resta posizionato a parte) */
.share-card > :not(.seal) {
  position: relative;
  z-index: 1;
}

.share-card::before,
.share-card::after {
  content: "";
  position: absolute;
  width: 120px;
  height: 120px;
  border: 1px solid rgba(128, 96, 58, .28);
  border-radius: 50%;
  pointer-events: none;
}

.share-card::before {
  left: -60px;
  top: -60px;
  clip-path: inset(60px 0 0 60px); /* solo lo spicchio dentro la scheda */
}

.share-card::after {
  right: -60px;
  bottom: -60px;
  clip-path: inset(0 60px 60px 0);
}

.seal {
  position: absolute;
  top: 0;
  left: 50%;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border: 5px solid var(--foglia);
  border-radius: 50%;
  background: var(--erba);
  color: var(--carta);
  box-shadow: 0 0 0 1px rgba(128, 96, 58, .42);
  transform: translate(-50%, -50%);
}

/* ---------- Interruttore a tre voci ----------
   Telefono: tre caselle uguali con l'icona sopra l'etichetta.
   Da 600px: pillola con icona e testo sulla stessa riga. */
.switch {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  margin: 0 0 24px;
  padding: 4px;
  border: 1px solid rgba(107, 113, 72, .16);
  border-radius: 20px;
  background: var(--verde-chiaro);
}

.switch button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 60px;
  padding: 6px 4px;
  border: 0;
  border-radius: 16px;
  background: transparent;
  font-size: .8125rem;
  font-weight: 500;
  line-height: 1.2;
  color: var(--oliva-soft);
  transition: background-color .2s, color .2s, box-shadow .2s;
}

.switch button svg {
  color: var(--fede-ink);
  transition: color .2s;
}

.switch button:hover {
  color: var(--oliva);
}

.switch button[aria-pressed="true"] {
  background: var(--oliva);
  box-shadow: 0 8px 18px -12px rgba(46, 50, 34, .8);
  color: var(--carta);
}

.switch button[aria-pressed="true"] svg {
  color: var(--tramonto);
}

h2 {
  font-size: clamp(2.125rem, 10vw, 3rem);
}

.lead {
  max-width: 30rem;
  margin: 6px auto 24px;
  font-size: .9375rem;
  color: var(--oliva-soft);
}

/* ---------- Campi ---------- */
.field {
  display: grid;
  gap: 6px;
  max-width: 440px;
  margin: 0 auto 22px;
  font-weight: 500;
  text-align: left;
}

.field label span {
  font-weight: 400;
  color: var(--oliva-soft);
}

.field input,
.field textarea {
  width: 100%;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: var(--foglia);
  font-weight: 400;
  transition: border-color .2s, box-shadow .2s;
}

.field textarea {
  display: block;
  padding: 12px 16px 30px;
  line-height: 1.5;
  resize: vertical;
}

.field input:focus,
.field textarea:focus {
  border-color: var(--oliva);
  box-shadow: 0 0 0 3px rgba(107, 113, 72, .15);
  outline: none;
}

.field-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.textarea-wrap {
  position: relative;
}

.counter {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: .8125rem;
  font-weight: 400;
  color: var(--oliva-soft);
}

.low {
  color: #9a3b2a !important;
}

/* disabilitato con colori pieni (non trasparente: i cerchi decorativi non traspaiono) */
.panel .btn:disabled {
  border-color: #a4a68f;
  background: #a4a68f;
  color: var(--carta);
  cursor: default;
}

.feedback {
  margin-top: 16px;
  font-weight: 500;
  color: var(--erba);
}

.feedback.is-error {
  color: #9a3b2a;
}

.text-link,
.alt-link a {
  padding: 0;
  border: 0;
  background: none;
  font-weight: 500;
  color: var(--oliva);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.alt-link {
  margin-top: 22px;
  font-size: .9375rem;
  color: var(--oliva-soft);
}

/* ---------- Foto: area di caricamento ----------
   Telefono: un unico grande pulsante verde (icona, testo, freccia).
   Da 600px: area tratteggiata dove trascinare i file, con il pulsante al centro. */
.dropzone {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  max-width: 440px;
  margin: 0 auto;
  padding: 16px 14px 16px 16px;
  border-radius: 20px;
  background: var(--oliva);
  box-shadow: 0 14px 28px -18px rgba(46, 50, 34, .9);
  color: var(--carta);
  text-align: left;
  cursor: pointer;
  transition: background-color .2s, border-color .2s, transform .15s;
}

.dropzone:active {
  transform: scale(.98);
}

.dropzone:has(input:focus-visible) {
  outline: 2px solid var(--fede-ink);
  outline-offset: 3px;
}

.drop-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(251, 248, 241, .14);
  color: var(--tramonto);
}

.drop-copy {
  display: grid;
  gap: 2px;
}

.drop-title {
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.3;
}

.drop-hint {
  font-size: .8125rem;
  line-height: 1.4;
  opacity: .8;
}

.drop-arrow {
  display: grid;
  color: var(--tramonto);
}

.on-pointer {
  display: none !important;
}

.queue {
  max-width: 440px;
  margin: 22px auto 0;
  text-align: left;
}

.queue-summary {
  margin-bottom: 8px;
  font-weight: 500;
}

.queue-list {
  max-height: 264px;
  overflow-y: auto;
  list-style: none;
  margin: 0 0 8px;
  padding: 0;
  font-size: .9375rem;
}

.queue-list li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid var(--line);
}

.queue-thumb {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 8px;
  background: var(--salvia);
  color: var(--oliva-soft);
}

.queue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.queue-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.queue-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--oliva-soft);
}

.is-done .queue-state { color: var(--erba); }
.is-error .queue-state,
.is-too_big .queue-state,
.is-wrong_type .queue-state { color: #9a3b2a; }
.is-uploading .queue-state,
.is-compressing .queue-state { animation: pulse 1.4s ease-in-out infinite; }

/* ---------- Polaroid in composizione ---------- */
.composer {
  margin: 4px 0 28px;
}

.polaroid-card {
  width: min(300px, 86%);
  margin: 0 auto;
  padding: 12px 12px 10px;
  border-radius: 4px;
  background: #fffdf8;
  box-shadow: 0 1px 2px rgba(46, 50, 34, .12), 0 22px 40px -22px rgba(46, 50, 34, .55);
  transform: rotate(-1.5deg);
  transition: transform .3s var(--ease);
}

.polaroid-card:focus-within {
  transform: rotate(0);
}

.polaroid-photo {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--salvia);
  cursor: pointer;
}

.empty .polaroid-photo {
  border: 1.5px dashed rgba(128, 96, 58, .45);
  background: var(--foglia);
}

.polaroid-photo:has(input:focus-visible) {
  outline: 2px solid var(--fede-ink);
  outline-offset: 2px;
}

.polaroid-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.polaroid-placeholder {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 16px;
  font-size: .9375rem;
  color: var(--oliva-soft);
  overflow-wrap: anywhere;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(128, 96, 58, .25);
  border-top-color: var(--fede-ink);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.polaroid-placeholder svg {
  color: var(--fede-ink);
}

.polaroid-change {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(46, 50, 34, .7);
  font-size: .75rem;
  font-weight: 500;
  color: var(--carta);
}

.polaroid-strip {
  padding: 10px 2px 2px;
  text-align: left;
}

.polaroid-strip textarea {
  display: block;
  width: 100%;
  min-height: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-style: italic;
  line-height: 1.25;
  color: var(--bosco);
  resize: none;
}

.polaroid-strip textarea::placeholder {
  color: rgba(95, 99, 77, .7);
}

.polaroid-strip textarea:focus {
  outline: none;
}

.polaroid-sign {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  font-size: .75rem;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--fede-ink);
}

.polaroid-sign .num {
  margin-left: auto;
  letter-spacing: 0;
  color: var(--oliva-soft);
}

/* ---------- Suggerimento ---------- */
.hint-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--carta);
  font-size: .875rem;
  font-weight: 500;
  color: var(--oliva);
  transition: background-color .2s, border-color .2s;
}

.hint-button svg {
  color: var(--fede-ink);
}

.hint-button:hover {
  border-color: var(--oliva);
  background: rgba(67, 74, 50, .06);
}

.hint {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(235, 201, 160, .45);
  animation: hint-in .25s var(--ease);
}

.hint-question {
  font-family: var(--font-display);
  font-size: 1.1875rem;
  font-style: italic;
  font-weight: 400;
  line-height: 1.35;
  color: var(--bosco);
}

.hint-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}

.hint-use {
  min-height: 36px;
  padding: 0;
  border: 0;
  background: none;
  font-size: .875rem;
  font-weight: 500;
  text-align: left;
  color: var(--fede-ink);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.hint-use em {
  font-weight: 400;
}

.hint-close {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--oliva-soft);
}

.hint-close:hover {
  background: rgba(67, 74, 50, .08);
}

@keyframes hint-in {
  from { opacity: 0; transform: translateY(-4px); }
}

@keyframes pulse {
  50% { opacity: .55; }
}

/* Telefono: pulsanti d'invio a tutta larghezza, scheda più compatta */
@media (max-width: 599px) {
  .panel > .btn {
    width: 100%;
  }

  .field {
    margin-bottom: 18px;
  }

  .seal {
    width: 56px;
    height: 56px;
  }
}

@media (min-width: 600px) {
  .share-card {
    margin: 0 auto;
    padding: 64px 48px 44px;
    border-radius: 72px 20px 72px 20px;
  }

  .switch {
    display: inline-grid;
    grid-template-columns: repeat(3, auto);
    margin-bottom: 28px;
    border-radius: 999px;
  }

  .switch button {
    flex-direction: row;
    gap: 8px;
    min-height: 44px;
    padding: 0 18px;
    border-radius: 999px;
    font-size: .9375rem;
  }

  .lead {
    font-size: 1rem;
  }

  /* area tratteggiata per trascinare i file */
  .dropzone {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 12px;
    padding: 28px 20px 26px;
    border: 1.5px dashed rgba(128, 96, 58, .5);
    background: var(--foglia);
    box-shadow: none;
    color: var(--oliva);
    text-align: center;
  }

  .dropzone:hover,
  .dropzone.dragging {
    border-color: var(--fede-ink);
    background: rgba(235, 201, 160, .22);
  }

  .dropzone:active {
    transform: none;
  }

  .drop-icon {
    width: 52px;
    height: 52px;
    background: var(--verde-chiaro);
    color: var(--erba);
  }

  .drop-hint {
    color: var(--oliva-soft);
    opacity: 1;
  }

  .on-touch {
    display: none !important;
  }

  .on-pointer {
    display: initial !important;
  }

  .drop-button.on-pointer {
    display: inline-flex !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hint,
  .is-uploading .queue-state { animation: none; }
  .polaroid-card { transform: none; transition: none; }
}
</style>
