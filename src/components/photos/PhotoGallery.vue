<script setup>
// Galleria a "bento" senza buchi: foto, polaroid (foto con dedica) e pensieri.
// La disposizione è calcolata da packBento (src/lib/bento.js); i riquadri seguono le proporzioni delle foto.
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { wedding } from '@/config/wedding'
import { packBento, shapeOf } from '@/lib/bento'

const props = defineProps({
  photos: { type: Array, required: true }, // le foto già scaricate (a pagine)
  total: { type: Number, default: 0 }, // tutte le foto presenti in Drive
  messages: { type: Array, required: true },
  status: { type: String, required: true }, // loading | ready | error | not_configured
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
  moreError: { type: Boolean, default: false }
})
const emit = defineEmits(['reload', 'more'])

const { perPage } = wedding.photos

// Anteprime servite da Drive (la cartella deve essere visibile a chi ha il link)
const thumb = (id, width) => `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`
const driveLink = id => `https://drive.google.com/file/d/${id}/view`

// ---------- Forme ----------
// Foto: orizzontale → wide (2×1) · verticale → tall (1×2) · quadrata → n (1×1), ogni tanto big (2×2).
// Polaroid: mai 1×1 (la striscia bianca ruberebbe troppo spazio) → verticale o grande.
// Pensieri: brevi → quadrato, lunghi → verticale o orizzontale (alternati).
const measured = ref({}) // id → proporzione misurata sull'anteprima, se Drive non la fornisce

function ratioOf(photo) {
  return photo.w && photo.h ? photo.w / photo.h : measured.value[photo.id]
}

function photoSize(photo, index, withCaption) {
  const ratio = ratioOf(photo)
  if (withCaption) return ratio >= 1.2 ? 'big' : 'tall'
  if (!ratio) return 'n'
  if (ratio >= 1.2) return 'wide'
  if (ratio <= 0.85) return 'tall'
  return index % 5 === 0 ? 'big' : 'n'
}

function onThumbLoad(item, e) {
  if (item.hasSize || measured.value[item.id]) return
  const { naturalWidth: w, naturalHeight: h } = e.target
  if (w && h) measured.value = { ...measured.value, [item.id]: w / h }
}

const SHORT_MESSAGE = 60
const TONES = ['carta', 'oliva', 'tramonto']

// ---------- Colonne ----------
const cols = ref(2)
const mqTablet = window.matchMedia('(min-width: 600px)')
const mqDesktop = window.matchMedia('(min-width: 960px)')
const updateCols = () => (cols.value = mqDesktop.matches ? 4 : mqTablet.matches ? 3 : 2)
updateCols()

// ---------- Pensieri sempre interi ----------
// Il testo non viene mai tagliato: ogni pensiero viene disegnato in un contenitore invisibile
// (stessi stili dei riquadri) largo 1 e 2 colonne; dall'altezza misurata si ricava quante righe
// della griglia gli servono. Le misure si rifanno quando cambia la larghezza o arrivano i font.
const plainMessages = computed(() => props.messages.filter(m => !m.foto))
const GAPS = { 2: 8, 3: 12, 4: 16 } // come --gap negli stili
const wrap = ref(null)
const wrapWidth = ref(0)
const measurer = ref(null)
const heights = ref({}) // id → { 1: px a una colonna, 2: px a due colonne }

const cell = computed(() => {
  const gap = GAPS[cols.value]
  return { gap, size: (wrapWidth.value - (cols.value - 1) * gap) / cols.value }
})
const spanWidth = w => w * cell.value.size + (w - 1) * cell.value.gap
const rowsFor = px => Math.max(1, Math.ceil((px + cell.value.gap) / (cell.value.size + cell.value.gap)))

function noteDims(id, long, preferTall) {
  const h = heights.value[id]
  if (!h || !h[1] || !h[2] || !(cell.value.size > 0)) return undefined
  const one = rowsFor(h[1])
  const two = rowsFor(h[2])
  if (!long) return { preferred: [1, one], narrow: [1, one] }
  // lunghi: verticali o orizzontali (alternati); se in una colonna diventerebbero una striscia, larghi
  if (preferTall && one <= 3) return { preferred: [1, Math.max(2, one)], narrow: [1, Math.max(2, one)] }
  return { preferred: [2, two], narrow: [1, one] }
}

let measureQueued = false
function measure() {
  if (measureQueued) return
  measureQueued = true
  nextTick(() => {
    measureQueued = false
    const root = measurer.value
    if (!root) return
    const next = {}
    for (const el of root.querySelectorAll('[data-id]')) {
      next[el.dataset.id] ||= {}
      next[el.dataset.id][el.dataset.w] = el.getBoundingClientRect().height
    }
    heights.value = next
  })
}

watch([plainMessages, () => cell.value.size], measure)
let resizeObserver = null

// ---------- Elementi della galleria ----------
// Le dediche (pensieri con `foto`) vanno sotto la loro foto; gli altri pensieri sono riquadri a sé,
// distribuiti in modo regolare tra le foto.
const captions = computed(() => {
  const map = {}
  for (const m of props.messages) if (m.foto && !map[m.foto]) map[m.foto] = m // il più recente
  return map
})

const photosCount = computed(() => Math.max(props.total, props.photos.length))
const notesCount = computed(() => props.messages.filter(m => !m.foto).length + Object.keys(captions.value).length)

const items = computed(() => {
  const media = props.photos.map((p, i) => {
    const caption = p.v ? null : captions.value[p.id] || null
    return {
      kind: p.v ? 'video' : caption ? 'polaroid' : 'photo',
      key: p.id,
      id: p.id,
      caption,
      hasSize: Boolean(p.w && p.h),
      size: photoSize(p, i, Boolean(caption)),
      narrow: caption ? 'tall' : undefined
    }
  })

  let longCount = 0
  const notes = plainMessages.value.map((m, i) => {
    const long = m.testo.length > SHORT_MESSAGE
    const preferTall = long && longCount++ % 2 === 1
    return {
      kind: 'message',
      flexible: true,
      key: m.id,
      nome: m.nome,
      testo: m.testo,
      size: !long ? 'n' : preferTall ? 'tall' : 'wide', // finché le misure non sono pronte
      dims: noteDims(m.id, long, preferTall),
      tone: TONES[i % TONES.length]
    }
  })

  // Il passo si calcola sul totale delle foto (non solo su quelle scaricate): così ogni pensiero
  // ha un posto fisso e compare quando arriva la pagina che lo contiene.
  const totalPhotos = Math.max(props.total, media.length)
  if (!notes.length) return media
  if (!totalPhotos) return notes
  const out = []
  const every = totalPhotos / notes.length
  let next = 0
  media.forEach((item, i) => {
    // il primo pensiero dopo un paio di foto, poi uno ogni "every" foto
    while (next < notes.length && i >= Math.floor(every * next + Math.min(2, every / 2))) out.push(notes[next++])
    out.push(item)
  })
  if (!props.hasMore) while (next < notes.length) out.push(notes[next++])
  return out
})

const isEmpty = computed(() => !props.photos.length && !props.messages.length)

// ---------- Disposizione ----------

const withShape = list => list.map(tile => ({ ...tile, shape: shapeOf(tile) }))
const tiles = computed(() => withShape(packBento(items.value, cols.value)))

// ---------- Comparsa a gruppi ----------
// I riquadri (già in ordine di lettura) compaiono a gruppi di perPage/5, uno ogni ~120 ms,
// così il browser non deve disegnare e scaricare tutto in un colpo.
const CHUNK = Math.max(1, Math.ceil(perPage / 5))
const rendered = ref(0)
const visibleTiles = computed(() => tiles.value.slice(0, rendered.value))
let revealTimer = null

function revealNext() {
  rendered.value = Math.min(rendered.value + CHUNK, tiles.value.length)
  revealTimer = rendered.value < tiles.value.length ? setTimeout(revealNext, 120) : null
}

watch(
  () => tiles.value.length,
  length => {
    if (rendered.value > length) rendered.value = length
    if (rendered.value < length && !revealTimer) revealNext()
  },
  { immediate: true }
)
// nuovo caricamento completo: si riparte da capo
watch(
  () => props.status,
  status => {
    if (status !== 'loading') return
    clearTimeout(revealTimer)
    revealTimer = null
    rendered.value = 0
  }
)
const skeletonTiles = computed(() =>
  withShape(packBento(['tall', 'n', 'wide', 'n', 'n', 'tall', 'wide', 'n', 'n'].map(size => ({ size })), cols.value))
)
const place = tile => ({
  gridColumn: `${tile.c + 1} / span ${tile.w}`,
  gridRow: `${tile.r + 1} / span ${tile.h}`
})

// ---------- Visualizzatore (nell'ordine della griglia; i video si aprono su Drive) ----------
const dialog = ref(null)
const viewable = computed(() => visibleTiles.value.map(t => t.item).filter(i => i.kind !== 'video'))
const currentKey = ref(null)
const active = computed(() => viewable.value.find(i => i.key === currentKey.value))
const position = computed(() => viewable.value.indexOf(active.value) + 1)

function open(item) {
  currentKey.value = item.key
  lockScroll()
  dialog.value?.showModal()
}

// Con il visualizzatore aperto la pagina sotto non scorre.
// scrollbar-gutter tiene il posto della barra di scorrimento: niente salto orizzontale.
function lockScroll() {
  const root = document.documentElement
  root.style.scrollbarGutter = 'stable'
  root.style.overflow = 'hidden'
}
function unlockScroll() {
  const root = document.documentElement
  root.style.overflow = ''
  root.style.scrollbarGutter = ''
}

function step(delta) {
  const list = viewable.value
  if (!list.length) return
  const i = (list.indexOf(active.value) + delta + list.length) % list.length
  currentKey.value = list[i].key
}

function onKey(e) {
  if (!dialog.value?.open) return
  if (e.key === 'ArrowRight') step(1)
  if (e.key === 'ArrowLeft') step(-1)
}

let touchX = null
const onTouchStart = e => (touchX = e.touches[0].clientX)
function onTouchEnd(e) {
  if (touchX === null) return
  const dx = e.changedTouches[0].clientX - touchX
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
  touchX = null
}

function onDialogClick(e) {
  if (e.target === dialog.value || e.target.classList.contains('viewer-stage')) dialog.value.close()
}

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => (wrapWidth.value = entry.contentRect.width))
  if (wrap.value) resizeObserver.observe(wrap.value)
  document.fonts?.ready.then(measure)
  document.fonts?.addEventListener?.('loadingdone', measure)
  window.addEventListener('keydown', onKey)
  mqTablet.addEventListener('change', updateCols)
  mqDesktop.addEventListener('change', updateCols)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  document.fonts?.removeEventListener?.('loadingdone', measure)
  clearTimeout(revealTimer)
  unlockScroll()
  window.removeEventListener('keydown', onKey)
  mqTablet.removeEventListener('change', updateCols)
  mqDesktop.removeEventListener('change', updateCols)
})
</script>

<template>
  <div class="gallery">
    <header class="gallery-head">
      <span class="section-index">La galleria</span>
      <h2 id="titolo-galleria">Momenti condivisi</h2>
      <div class="gallery-meta">
        <p v-if="status === 'ready' && !isEmpty" class="gallery-count">
          <span class="num">{{ photosCount }}</span> foto
          <span aria-hidden="true">·</span>
          <span class="num">{{ notesCount }}</span> {{ notesCount === 1 ? 'pensiero' : 'pensieri' }}
        </p>
        <button class="chip-link refresh" type="button" :disabled="status === 'loading'" @click="emit('reload')">
          <AppIcon name="refresh" :size="16" />Aggiorna
        </button>
      </div>
    </header>

    <div ref="wrap" class="bento-wrap">
      <!-- Misure dei pensieri (invisibile): stessa grafica dei riquadri, a 1 e 2 colonne -->
      <div v-if="plainMessages.length && cell.size > 0" ref="measurer" class="measurer" aria-hidden="true">
        <template v-for="(m, i) in plainMessages" :key="m.id">
          <div
            v-for="w in [1, 2]"
            :key="w"
            class="note"
            :class="`t-${TONES[i % TONES.length]}`"
            :data-id="m.id"
            :data-w="w"
            :style="{ width: spanWidth(w) + 'px' }"
          >
            <span class="note-quote">“</span>
            <span class="note-text">{{ m.testo }}</span>
            <span v-if="m.nome" class="note-name">{{ m.nome }}</span>
          </div>
        </template>
      </div>

      <ul
        v-if="status === 'loading'"
        class="bento"
        :style="{ '--cols': cols }"
        aria-busy="true"
        aria-label="Caricamento della galleria"
      >
        <li v-for="(tile, n) in skeletonTiles" :key="n" class="tile skeleton" :style="place(tile)"></li>
      </ul>

      <div v-else-if="status !== 'ready' || isEmpty" class="gallery-empty" :role="status === 'error' ? 'alert' : undefined">
        <span class="empty-icon" aria-hidden="true"><AppIcon name="camera" :size="28" /></span>
        <template v-if="status === 'error'">
          <p>Non riusciamo a caricare la galleria in questo momento.</p>
          <button class="btn" type="button" @click="emit('reload')">Riprova</button>
        </template>
        <p v-else-if="status === 'not_configured'">La galleria sarà disponibile a breve.</p>
        <template v-else>
          <p>Ancora nessuna foto: la prima potrebbe essere la vostra!</p>
          <a class="btn" href="#condividi">Condividi uno scatto</a>
        </template>
      </div>

      <template v-else>
        <ul class="bento" :style="{ '--cols': cols }">
          <li
            v-for="{ item, shape, ...tile } in visibleTiles"
            :key="item.key"
            class="tile"
            :class="[`s-${shape}`, `k-${item.kind}`]"
            :style="place(tile)"
          >
            <!-- Pensiero -->
            <button
              v-if="item.kind === 'message'"
              type="button"
              class="note"
              :class="`t-${item.tone}`"
              :aria-label="`Leggi il pensiero${item.nome ? ' di ' + item.nome : ''}`"
              @click="open(item)"
            >
              <span class="note-quote" aria-hidden="true">“</span>
              <span class="note-text">{{ item.testo }}</span>
              <span v-if="item.nome" class="note-name">{{ item.nome }}</span>
            </button>

            <!-- Polaroid: foto con dedica -->
            <button
              v-else-if="item.kind === 'polaroid'"
              type="button"
              class="polaroid"
              :aria-label="`Apri la foto con la dedica${item.caption.nome ? ' di ' + item.caption.nome : ''}`"
              @click="open(item)"
            >
              <span class="polaroid-img">
                <img
                  :src="thumb(item.id, 1000)"
                  alt=""
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @load="onThumbLoad(item, $event)"
                >
              </span>
              <span class="polaroid-caption">
                <span class="polaroid-text">{{ item.caption.testo }}</span>
                <span v-if="item.caption.nome" class="polaroid-name">{{ item.caption.nome }}</span>
              </span>
            </button>

            <!-- Video: si apre su Drive -->
            <a
              v-else-if="item.kind === 'video'"
              :href="driveLink(item.id)"
              target="_blank"
              rel="noopener noreferrer"
              class="photo"
              aria-label="Guarda il video su Google Drive"
            >
              <img
                :src="thumb(item.id, item.size === 'n' ? 600 : 1000)"
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                @load="onThumbLoad(item, $event)"
              >
              <span class="play" aria-hidden="true"><AppIcon name="play" :size="18" /></span>
            </a>

            <!-- Foto -->
            <button v-else type="button" class="photo" aria-label="Apri la foto" @click="open(item)">
              <img
                :src="thumb(item.id, item.size === 'n' ? 600 : 1000)"
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                @load="onThumbLoad(item, $event)"
              >
            </button>
          </li>
        </ul>

        <div v-if="hasMore" class="more">
          <button class="btn" type="button" :disabled="loadingMore" @click="emit('more')">
            <AppIcon name="refresh" :size="18" :class="{ spinning: loadingMore }" />
            {{ loadingMore ? 'Caricamento…' : 'Carica altre foto' }}
          </button>
          <p class="more-note">
            <template v-if="moreError">Non siamo riusciti a caricarle: riprova.</template>
            <template v-else>Ne hai viste <span class="num">{{ photos.length }}</span> di <span class="num">{{ photosCount }}</span></template>
          </p>
        </div>
      </template>
    </div>

    <dialog
      ref="dialog"
      class="viewer"
      :aria-label="active?.kind === 'message' ? 'Pensiero per gli sposi' : 'Foto a schermo intero'"
      @close="unlockScroll"
      @click="onDialogClick"
      @touchstart.passive="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div v-if="active" class="viewer-stage">
        <figure v-if="active.kind === 'message'" :key="active.key" class="viewer-note">
          <span class="note-quote" aria-hidden="true">“</span>
          <blockquote>{{ active.testo }}</blockquote>
          <figcaption v-if="active.nome">{{ active.nome }}</figcaption>
        </figure>

        <figure v-else-if="active.kind === 'polaroid'" :key="active.key" class="viewer-polaroid">
          <img :src="thumb(active.id, 1600)" :alt="`Foto ${position} di ${viewable.length}`" referrerpolicy="no-referrer">
          <figcaption>
            <span class="polaroid-text">{{ active.caption.testo }}</span>
            <span v-if="active.caption.nome" class="polaroid-name">{{ active.caption.nome }}</span>
          </figcaption>
        </figure>

        <img
          v-else
          :key="active.key"
          class="viewer-img"
          :src="thumb(active.id, 1600)"
          :alt="`Foto ${position} di ${viewable.length}`"
          referrerpolicy="no-referrer"
        >
      </div>
      <div v-if="active" class="viewer-bar">
        <span class="num">{{ position }} / {{ viewable.length }}</span>
        <a v-if="active.kind !== 'message'" :href="driveLink(active.id)" target="_blank" rel="noopener noreferrer">
          Originale<AppIcon name="external" :size="15" />
        </a>
      </div>
      <button class="viewer-btn close" type="button" aria-label="Chiudi" @click="dialog.close()">
        <AppIcon name="close" />
      </button>
      <button v-if="viewable.length > 1" class="viewer-btn prev" type="button" aria-label="Precedente" @click="step(-1)">
        <AppIcon name="chevron" />
      </button>
      <button v-if="viewable.length > 1" class="viewer-btn next" type="button" aria-label="Successivo" @click="step(1)">
        <AppIcon name="chevron" />
      </button>
    </dialog>
  </div>
</template>

<style scoped>
/* ---------- Intestazione ---------- */
.gallery-head {
  margin-bottom: 32px;
  text-align: center;
}

.gallery-head h2 {
  margin-top: 6px;
  font-size: clamp(2.5rem, 10vw, 3.75rem);
}

.gallery-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px 18px;
  margin-top: 14px;
}

.gallery-count {
  display: inline-flex;
  gap: 6px;
  color: var(--oliva-soft);
}

.refresh {
  background: var(--carta);
}

.refresh:disabled {
  opacity: .5;
  cursor: default;
}

/* ---------- Griglia ----------
   Righe quadrate: altezza di riga = larghezza di colonna (unità cqi sul contenitore).
   Posizione e dimensione di ogni riquadro arrivano da packBento (style inline). */
.bento-wrap {
  container-type: inline-size;
}

.bento {
  --gap: 8px;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  grid-auto-rows: calc((100cqi - (var(--cols) - 1) * var(--gap)) / var(--cols));
  gap: var(--gap);
  list-style: none;
  margin: 0;
  padding: 0;
}

.tile {
  position: relative;
  min-width: 0;
  border-radius: 14px;
}

.tile > * {
  width: 100%;
  height: 100%;
}

/* Foto semplice */
.photo {
  display: block;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-radius: inherit;
  background: var(--salvia);
}

.photo img,
.polaroid-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .6s var(--ease);
}

.photo:hover img,
.polaroid:hover .polaroid-img img {
  transform: scale(1.04);
}

.play {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(46, 50, 34, .7);
  color: var(--carta);
}

/* ---------- Polaroid ---------- */
.polaroid {
  display: flex;
  flex-direction: column;
  padding-inline: 0;
  border: 0;
  border-radius: 4px;
  background: #fffdf8;
  box-shadow: 0 1px 2px rgba(46, 50, 34, .12), 0 16px 30px -22px rgba(46, 50, 34, .6);
  text-align: left;
  transition: transform .3s var(--ease), box-shadow .3s var(--ease);
}

.polaroid:hover {
  transform: translateY(-3px) rotate(-.6deg);
  box-shadow: 0 1px 2px rgba(46, 50, 34, .12), 0 24px 40px -24px rgba(46, 50, 34, .7);
}

.polaroid-img {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--salvia);
}

.polaroid-caption {
  display: grid;
  gap: 2px;
  padding: 8px 4px 10px;
}

/* la dedica è sempre intera: la foto si restringe per farle posto */
.polaroid-text {
  font-family: var(--font-display);
  font-size: 1rem;
  font-style: italic;
  line-height: 1.25;
  overflow-wrap: anywhere;
  color: var(--bosco);
}

.polaroid-name {
  overflow: hidden;
  font-size: .6875rem;
  font-weight: 500;
  letter-spacing: .08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--fede-ink);
}

.polaroid-name::before {
  content: "— ";
}

/* ---------- Pensieri ---------- */
.note {
  display: flex;
  flex-direction: column;
  padding: 14px 16px 16px;
  border: 1px solid rgba(107, 113, 72, .22);
  /* angoli alternati come le schede del sito */
  border-radius: 28px 8px 28px 8px;
  text-align: left;
  transition: transform .3s var(--ease), box-shadow .3s var(--ease);
}

.note:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 34px -24px rgba(46, 50, 34, .55);
}

.t-carta {
  background: var(--carta);
  color: var(--oliva);
}

.t-oliva {
  border-color: transparent;
  background: var(--oliva);
  color: var(--carta);
}

.t-tramonto {
  border-color: transparent;
  background: var(--tramonto);
  color: var(--bosco);
}

.note-quote {
  font-family: var(--font-display);
  font-size: 2.25rem;
  line-height: .7;
  color: var(--fede);
}

.t-tramonto .note-quote {
  color: var(--fede-ink);
}

/* testo sempre intero: il riquadro è alto quanto serve (vedi "Pensieri sempre interi") */
.note-text {
  flex: 1;
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-style: italic;
  line-height: 1.3;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

/* contenitore di misura: fuori schermo, invisibile, non cliccabile */
.bento-wrap {
  position: relative;
}

.measurer {
  position: absolute;
  top: 0;
  left: 0;
  height: 0;
  overflow: hidden;
  visibility: hidden;
  pointer-events: none;
}

.measurer .note {
  height: auto;
}

.note-name {
  margin-top: 8px;
  overflow: hidden;
  font-size: .75rem;
  font-weight: 500;
  letter-spacing: .08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  opacity: .85;
}

.note-name::before {
  content: "— ";
}

/* ---------- Stati ---------- */
.skeleton {
  background: rgba(200, 205, 170, .6);
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  50% { opacity: .5; }
}

.gallery-empty {
  display: grid;
  justify-items: center;
  gap: 16px;
  max-width: 420px;
  margin: 0 auto;
  padding: 40px 24px;
  border: 1.5px dashed rgba(128, 96, 58, .4);
  border-radius: 48px 16px 48px 16px;
  text-align: center;
  color: var(--oliva-soft);
}

.empty-icon {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--carta);
  color: var(--fede-ink);
}

.gallery-empty .btn {
  background: var(--carta);
}

.more {
  margin-top: 36px;
  text-align: center;
}

.more .btn {
  background: var(--carta);
}

.more .btn:disabled {
  cursor: default;
  opacity: .7;
}

.more-note {
  margin-top: 10px;
  font-size: .875rem;
  color: var(--oliva-soft);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ogni riquadro nuovo compare con una breve dissolvenza */
.bento > .tile:not(.skeleton) {
  animation: tile-in .45s var(--ease) both;
}

@keyframes tile-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

/* ---------- Visualizzatore ---------- */
.viewer {
  overscroll-behavior: contain;
  width: 100vw;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: rgba(30, 32, 22, .95);
  color: var(--carta);
}

.viewer::backdrop {
  background: transparent;
}

.viewer-stage {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 64px 16px 72px;
  overflow: hidden;
}

.viewer-img {
  max-width: 95vw;
  max-height: 85vh;
  object-fit: contain;
}

.viewer-polaroid {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;
  margin: 0;
  padding: 12px 12px 0;
  border-radius: 4px;
  background: #fffdf8;
  box-shadow: 0 30px 60px -30px rgba(0, 0, 0, .7);
}

.viewer-polaroid img {
  min-height: 0;
  max-width: 100%;
  max-height: calc(100dvh - 136px - 110px);
  object-fit: contain;
}

.viewer-polaroid figcaption {
  display: grid;
  gap: 4px;
  max-width: 36rem;
  padding: 14px 6px 18px;
}

.viewer-polaroid .polaroid-text {
  font-size: 1.375rem;
}

.viewer-polaroid .polaroid-name {
  font-size: .8125rem;
}

.viewer-note {
  width: min(560px, 100%);
  max-height: 100%;
  overflow-y: auto;
  margin: 0;
  padding: 28px 28px 32px;
  border-radius: 40px 12px 40px 12px;
  background: var(--carta);
  color: var(--oliva);
}

.viewer-note .note-quote {
  display: block;
  font-size: 4rem;
}

.viewer-note blockquote {
  margin: 8px 0 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-style: italic;
  line-height: 1.4;
  white-space: pre-line;
}

.viewer-note figcaption {
  margin-top: 20px;
  font-size: .875rem;
  font-weight: 500;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--fede-ink);
}

.viewer-note figcaption::before {
  content: "— ";
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
  .bento {
    --gap: 12px;
  }

  .note {
    padding: 18px 20px 20px;
  }

  .note-text {
    font-size: 1.25rem;
  }

  .polaroid {
    padding: 9px 9px 0;
  }

  .polaroid-caption {
    padding: 10px 4px 12px;
  }

  .polaroid-text {
    font-size: 1.125rem;
  }
}

@media (min-width: 960px) {
  .gallery-head {
    margin-bottom: 44px;
  }

  .bento {
    --gap: 16px;
  }

  .tile {
    border-radius: 20px;
  }

  .note {
    padding: 22px 24px 24px;
    border-radius: 40px 12px 40px 12px;
  }

  .note-quote {
    font-size: 3rem;
  }


  .polaroid {
    padding: 0;
  }

  .polaroid-caption {
    padding: 12px 6px 16px;
  }

  .s-big .polaroid-text {
    font-size: 1.375rem;
  }

  .prev { left: 24px; }
  .next { right: 24px; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .spinning,
  .bento > .tile:not(.skeleton) { animation: none; }
  .photo img,
  .polaroid-img img,
  .note,
  .polaroid { transition: none; }
}
</style>
