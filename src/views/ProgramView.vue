<script setup>
import ProgramTimeline from '@/components/ProgramTimeline.vue'
import PlaceCard from '@/components/PlaceCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import { wedding } from '@/config/wedding'

const { program, places } = wedding

// Icona del momento collegato al luogo (chiesa, calice…)
const iconOf = id => program.events.find(e => e.placeId === id)?.icon || 'pin'

const headings = {
  cerimonia: { title: 'Il nostro sì', parkingTitle: 'Dove parcheggiare' },
  ricevimento: { title: 'Si festeggia', parkingTitle: 'Parcheggio' }
}
</script>

<template>
  <main class="page program-page">
    <section class="program-intro">
      <div class="container">
        <div class="section-head">
          <span class="section-index">Programma</span>
          <h1>Il grande giorno</h1>
          <p class="program-date">
            <time datetime="2027-04-24">{{ program.day }} {{ wedding.dateLong }}</time>, {{ wedding.city }}
          </p>
          <p>Orari, luoghi e qualche informazione pratica per vivere la giornata con noi.</p>
        </div>
      </div>
    </section>

    <section class="program-timeline" aria-label="Orari della giornata">
      <div class="container">
        <ProgramTimeline />
      </div>
    </section>

    <section
      v-for="place in places"
      :id="place.id"
      :key="place.id"
      class="program-place"
      :aria-labelledby="`titolo-${place.id}`"
    >
      <div class="container">
        <!-- Scheda del luogo: sigillo con icona, etichetta, dati, poi parcheggi o indicazioni -->
        <article class="place-sheet">
          <span class="place-seal" aria-hidden="true"><AppIcon :name="iconOf(place.id)" :size="26" /></span>
          <p class="place-badge">{{ place.label }} · ore {{ place.time }}</p>

          <PlaceCard :place="place" />

          <div v-if="place.parking?.length" class="place-extra">
            <h3 class="extra-head">
              <AppIcon name="parking" :size="22" />
              {{ headings[place.id]?.parkingTitle || 'Parcheggi' }}
            </h3>
            <ul class="parking-list">
              <li v-for="spot in place.parking" :key="spot.name" class="parking-item">
                <div>
                  <strong>{{ spot.name }}</strong>
                  <p>{{ spot.note }}</p>
                </div>
                <a class="chip-link" :href="spot.map" target="_blank" rel="noopener noreferrer">
                  <AppIcon name="pin" :size="16" />Maps<span class="sr-only">: {{ spot.name }}</span>
                </a>
              </li>
            </ul>
          </div>

          <div v-if="place.directions" class="place-extra">
            <h3 class="extra-head">
              <AppIcon name="car" :size="22" />
              {{ place.directions.title }}
            </h3>
            <p class="directions-text">{{ place.directions.text }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="program-cta">
      <div class="container">
        <h2>Sarete con noi?</h2>
        <RouterLink class="btn primary block" to="/rsvp">Conferma la tua presenza</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.program-page {
  background: var(--glow) top / 100% 640px no-repeat, var(--foglia);
}

.program-intro {
  padding: 40px 0 8px;
}

.program-date {
  font-weight: 500;
  color: var(--oliva);
}

.program-date time::first-letter {
  text-transform: uppercase;
}

.program-timeline {
  padding: 16px 0 72px;
}

/* ---------- Sezioni dei luoghi ---------- */
.program-place {
  padding: 72px 0 56px;
}

.program-place:nth-of-type(odd) {
  background: var(--verde-chiaro);
}

/* La scheda: carta chiara, bordo ulivo, angoli morbidi */
.place-sheet {
  position: relative;
  max-width: 960px;
  margin: 0 auto;
  padding: 52px 20px 28px;
  border: 1px solid rgba(107, 113, 72, .28);
  border-radius: 32px;
  background: var(--carta);
  box-shadow: 0 28px 60px -40px rgba(46, 50, 34, .45);
}

/* Sigillo verde a cavallo del bordo superiore */
.place-seal {
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

.place-badge {
  display: table;
  margin: 0 auto 22px;
  padding: 6px 16px;
  border-radius: 999px;
  background: var(--verde-chiaro);
  font-size: .8125rem;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--erba);
}

.program-place:nth-of-type(odd) .place-badge {
  background: rgba(200, 205, 170, .45);
}

/* Parcheggi / Come arrivare: in fondo alla scheda, separati */
.place-extra {
  margin-top: 32px;
  padding-top: 26px;
  border-top: 1px dashed rgba(107, 113, 72, .4);
}

.extra-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 1.875rem;
}

.extra-head svg {
  flex-shrink: 0;
  color: var(--erba);
}

.directions-text {
  max-width: 40rem;
  color: var(--oliva-soft);
}

.parking-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

/* nome e nota a sinistra, pulsante Maps allineato a destra */
.parking-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
}

.parking-item + .parking-item {
  border-top: 1px solid var(--line);
}

.parking-item strong {
  font-weight: 500;
}

.parking-item p {
  margin-top: 2px;
  font-size: .9375rem;
  color: var(--oliva-soft);
}

.parking-item .chip-link {
  justify-self: end;
}

/* Info utili */
.program-practical {
  padding: 64px 0;
  border-top: 1px solid var(--line);
}

.practical-list {
  display: grid;
  list-style: none;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;
}

.practical-item {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 14px;
  padding: 20px 0;
  border-top: 1px solid var(--line);
}

.practical-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--erba);
  color: var(--carta);
}

.practical-item h3 {
  font-size: 1.375rem;
}

.practical-item p {
  margin-top: 4px;
  color: var(--oliva-soft);
}

.practical-item p.pending {
  font-style: italic;
}

/* Chiusura */
/* Chiusura su banda verde ulivo */
.program-cta {
  padding: 64px 0 80px;
  background: var(--oliva);
  color: var(--carta);
  text-align: center;
}

.program-cta .btn.primary {
  border-color: var(--tramonto);
  background: var(--tramonto);
  color: var(--bosco);
}

.program-cta .btn.primary:hover {
  border-color: var(--carta);
  background: var(--carta);
}

.program-cta h2 {
  margin-bottom: 24px;
  font-size: clamp(2.25rem, 9vw, 3.5rem);
}

@media (min-width: 600px) {
  .practical-list {
    grid-template-columns: 1fr 1fr;
    column-gap: 48px;
  }
}

@media (min-width: 960px) {
  .program-intro {
    padding-top: 72px;
  }

  .program-timeline {
    padding-bottom: 112px;
  }

  .program-place {
    padding: 112px 0 96px;
  }

  .place-sheet {
    padding: 64px 56px 44px;
    border-radius: 44px;
  }

  .place-seal {
    width: 76px;
    height: 76px;
  }

  .practical-list {
    grid-template-columns: repeat(3, 1fr);
  }

  .program-cta {
    padding: 112px 0 128px;
  }
}
</style>
