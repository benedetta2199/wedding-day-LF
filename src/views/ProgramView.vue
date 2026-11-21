<script setup>
import ProgramTimeline from '@/components/ProgramTimeline.vue'
import PlaceCard from '@/components/PlaceCard.vue'
import AppIcon from '@/components/AppIcon.vue'
import { wedding } from '@/config/wedding'

const { program, places } = wedding

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
        <div class="section-head">
          <span class="section-index">{{ place.label }}, ore {{ place.time }}</span>
          <h2 :id="`titolo-${place.id}`">{{ headings[place.id]?.title || place.label }}</h2>
        </div>

        <PlaceCard :place="place" />

        <div v-if="place.parking?.length" v-reveal class="parking">
          <h3 class="parking-head">
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
      </div>
    </section>

    <section class="program-practical" aria-labelledby="info-utili">
      <div class="container">
        <div class="section-head">
          <span class="section-index">Info utili</span>
          <h2 id="info-utili">Da sapere</h2>
        </div>
        <ul class="practical-list">
          <li v-for="item in program.practical" :key="item.title" class="practical-item">
            <span class="practical-icon"><AppIcon :name="item.icon" :size="22" /></span>
            <div>
              <h3>{{ item.title }}</h3>
              <p :class="{ pending: item.text === 'Dettagli in arrivo.' }">{{ item.text }}</p>
            </div>
          </li>
        </ul>
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

.program-place {
  padding: 64px 0;
  border-top: 1px solid var(--line);
}

.program-place:nth-of-type(odd) {
  background: var(--verde-chiaro);
}

/* Parcheggi */
.parking {
  max-width: 760px;
  margin: 48px auto 0;
}

.parking-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 1.625rem;
}

.parking-head svg {
  color: var(--erba);
}

.parking-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.parking-item {
  display: grid;
  gap: 10px;
  padding: 16px 0;
  border-top: 1px solid var(--line);
}

.parking-item:last-child {
  border-bottom: 1px solid var(--line);
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
  justify-self: start;
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
  .parking-item {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 24px;
  }

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

  .program-place,
  .program-practical {
    padding: 112px 0;
  }

  .practical-list {
    grid-template-columns: repeat(3, 1fr);
  }

  .program-cta {
    padding: 112px 0 128px;
  }
}
</style>
