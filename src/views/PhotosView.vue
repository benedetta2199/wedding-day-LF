<script setup>
// Pagina /foto: intestazione, scheda per condividere (foto, foto con dedica, pensiero) e galleria.
import { ref, computed, onMounted } from 'vue'
import ShareCard from '@/components/photos/ShareCard.vue'
import PhotoGallery from '@/components/photos/PhotoGallery.vue'
import { wedding } from '@/config/wedding'
import { fetchGallery } from '@/lib/rsvpApi'

const { perPage } = wedding.photos

const photos = ref([]) // foto già scaricate (le prime N, dalla più recente)
const total = ref(0) // foto presenti in Drive
const messages = ref([])
const status = ref('loading') // loading | ready | error | not_configured
const loadingMore = ref(false)
const moreError = ref(false)
const hasMore = computed(() => photos.value.length < total.value)

// Prima pagina. silent: aggiorna senza segnaposto (dopo un caricamento dal sito)
// e mantiene il numero di foto già mostrate.
async function load(silent = false) {
  if (!silent) status.value = 'loading'
  try {
    const limit = silent ? Math.max(perPage, photos.value.length) : perPage
    const data = await fetchGallery({ offset: 0, limit })
    photos.value = data.photos
    total.value = data.total
    messages.value = data.messages
    status.value = 'ready'
  } catch (error) {
    if (!silent) status.value = error.message === 'not_configured' ? 'not_configured' : 'error'
  }
}

// "Carica altre": la pagina successiva. Se nel frattempo sono arrivate foto nuove,
// l'elenco sul server è slittato: i doppioni si scartano per ID.
async function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  moreError.value = false
  try {
    const data = await fetchGallery({ offset: photos.value.length, limit: perPage })
    const known = new Set(photos.value.map(p => p.id))
    photos.value = [...photos.value, ...data.photos.filter(p => !known.has(p.id))]
    total.value = data.total
    messages.value = data.messages
  } catch {
    moreError.value = true
  } finally {
    loadingMore.value = false
  }
}

// Pensiero appena inviato: compare subito, senza ricaricare
const addMessage = message => (messages.value = [message, ...messages.value])

// Nell'arco dell'intestazione: l'ultima foto degli ospiti, oppure la foto degli sposi
const archPhoto = computed(() => {
  const latest = photos.value.find(p => !p.v)
  return latest
    ? { src: `https://drive.google.com/thumbnail?id=${latest.id}&sz=w800`, alt: 'L’ultima foto condivisa dagli ospiti', remote: true }
    : { src: wedding.hero.photo, alt: wedding.hero.photoAlt, remote: false }
})

onMounted(() => load())
</script>

<template>
  <main class="page photos-page">
    <!-- ===== Intestazione ===== -->
    <section class="photos-intro">
      <div class="container intro-grid">
        <div class="intro-copy">
          <span class="section-index">Foto &amp; pensieri</span>
          <h1>I vostri scatti</h1>
          <p>
            Ogni foto racconta un pezzo della giornata. Condividete i vostri scatti, scriveteci una dedica
            o lasciateci un pensiero: li raccogliamo tutti qui, per ricordarli insieme.
          </p>
          <div class="divider" aria-hidden="true"><span>♡</span></div>
          <a class="btn primary" href="#condividi">Condividi un ricordo</a>
        </div>

        <figure class="intro-arch">
          <div class="arch">
            <img
              :key="archPhoto.src"
              :src="archPhoto.src"
              :alt="archPhoto.alt"
              :referrerpolicy="archPhoto.remote ? 'no-referrer' : undefined"
            >
          </div>
          <figcaption>{{ wedding.names }} · {{ wedding.dateShort }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- ===== Condividi ===== -->
    <section id="condividi" class="photos-share" aria-label="Condividi foto e pensieri">
      <div class="container">
        <ShareCard v-reveal @refresh="load(true)" @message="addMessage" />
      </div>
    </section>

    <!-- ===== Galleria ===== -->
    <section class="photos-gallery" aria-labelledby="titolo-galleria">
      <div class="container">
        <PhotoGallery
          :photos="photos"
          :total="total"
          :messages="messages"
          :status="status"
          :has-more="hasMore"
          :loading-more="loadingMore"
          :more-error="moreError"
          @reload="load()"
          @more="loadMore"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.photos-page {
  background: var(--glow) top / 100% 720px no-repeat, var(--foglia);
}

/* ---------- Intestazione ---------- */
.photos-intro {
  padding: 32px 0 8px;
}

.intro-grid {
  display: grid;
  gap: 32px;
  justify-items: center;
  text-align: center;
}

.intro-copy {
  max-width: 34rem;
}

.intro-copy h1 {
  margin-top: 8px;
  font-size: clamp(2.75rem, 12vw, 4.5rem);
}

.intro-copy p {
  margin-top: 14px;
  color: var(--oliva-soft);
}

/* Divisore oro con cuore, come nella sezione regalo della home */
.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 24px 0;
  color: var(--fede-ink);
}

.divider::before,
.divider::after {
  content: "";
  width: 64px;
  height: 1px;
  background: currentColor;
  opacity: .55;
}

.intro-arch {
  order: -1;
  width: min(240px, 64vw);
  margin: 0;
}

.intro-arch .arch {
  aspect-ratio: 3 / 4;
  border: 6px solid var(--carta);
  box-shadow: 0 0 0 1px rgba(128, 96, 58, .35), 0 30px 60px -36px rgba(46, 50, 34, .55);
}

.intro-arch figcaption {
  margin-top: 14px;
  font-family: var(--font-display);
  font-style: italic;
  font-variant-numeric: lining-nums;
  color: var(--fede-ink);
}

/* ---------- Condividi ---------- */
.photos-share {
  padding: 72px 0 80px;
  scroll-margin-top: 40px;
}

/* ---------- Galleria ---------- */
.photos-gallery {
  padding: 64px 0 96px;
  border-top: 1px solid var(--line);
  background: var(--verde-chiaro);
}

@media (min-width: 960px) {
  .photos-intro {
    padding: 72px 0 24px;
  }

  .intro-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, .9fr);
    align-items: center;
    gap: 64px;
    text-align: left;
  }

  .divider {
    justify-content: flex-start;
  }

  .divider::before {
    display: none;
  }

  .intro-arch {
    order: 0;
    width: min(380px, 100%);
    justify-self: center;
  }

  .photos-share {
    padding: 96px 0 120px;
  }

  .photos-gallery {
    padding: 104px 0 136px;
  }
}
</style>
