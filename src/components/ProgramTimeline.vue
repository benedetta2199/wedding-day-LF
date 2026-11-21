<script setup>
import { computed } from 'vue'
import IconPin from './IconPin.vue'
import { wedding } from '@/config/wedding'

// extended = versione della pagina /programma (descrizione, foto e dettagli).
const props = defineProps({
  extended: { type: Boolean, default: false }
})

const events = computed(() =>
  wedding.program.events.map(event => {
    const place = wedding.places.find(p => p.id === event.placeId)
    return {
      ...event,
      map: place?.map,
      photo: props.extended ? place?.gallery[0] : null
    }
  })
)
</script>

<template>
  <ol class="timeline" :class="{ extended }">
    <li
      v-for="(event, i) in events"
      :id="extended ? `programma-${event.id}` : `ev-${event.id}`"
      :key="event.id"
      v-reveal
      class="event"
    >
      <div class="time-col">
        <span class="time">{{ event.time }}</span>
        <span class="dot" aria-hidden="true"></span>
        <span v-if="i < events.length - 1" class="line" aria-hidden="true"></span>
      </div>

      <article class="card">
        <img v-if="event.photo" class="card-photo" :src="event.photo.src" :alt="event.photo.alt" loading="lazy">
        <div class="card-body">
          <header class="card-header">
            <span class="card-icon" aria-hidden="true">{{ event.icon }}</span>
            <div>
              <h3 class="card-title">{{ event.title }}</h3>
              <p v-if="event.place" class="card-place">{{ event.place }}</p>
            </div>
          </header>

          <p v-if="event.address" class="address"><IconPin />{{ event.address }}</p>

          <p v-if="extended && event.details" class="details">{{ event.details }}</p>
          <p v-else-if="event.note" class="note">{{ event.note }}</p>

          <dl v-if="extended && event.info.length" class="info">
            <div v-for="[label, value] in event.info" :key="label">
              <dt>{{ label }}</dt>
              <dd>{{ value }}</dd>
            </div>
          </dl>

          <a v-if="event.map" class="maps-link" :href="event.map" target="_blank" rel="noopener noreferrer">
            <IconPin />Apri in Maps
          </a>
        </div>
      </article>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 680px;
}

.timeline.extended {
  max-width: 860px;
}

.event {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 22px;
}

.time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 22px;
}

.time {
  font: 600 .78rem Manrope, sans-serif;
  letter-spacing: .1em;
  color: var(--gold);
  white-space: nowrap;
}

.dot {
  width: 11px;
  height: 11px;
  margin: 12px 0 6px;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 0 5px rgba(122, 112, 64, .14);
  flex-shrink: 0;
}

.line {
  flex: 1;
  width: 1px;
  background: linear-gradient(var(--gold), rgba(122, 112, 64, .15));
}

.card {
  margin-bottom: 26px;
  overflow: hidden;
  border: 1px solid rgba(122, 112, 64, .3);
  border-radius: 22px;
  background: rgba(247, 245, 239, .9);
  box-shadow: 0 18px 50px rgba(38, 51, 24, .08);
}

.card-photo {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 7;
  object-fit: cover;
}

.card-body {
  padding: 26px 28px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border: 1px solid rgba(122, 112, 64, .35);
  border-radius: 50%;
  font-size: 1.35rem;
  background: var(--ivory);
}

.card-title {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 500;
  line-height: 1.1;
  color: var(--petrol);
}

.card-place {
  margin: 4px 0 0;
  font-size: 1.12rem;
  font-style: italic;
  color: rgba(61, 78, 47, .75);
}

.address {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 18px 0 0;
  font: 500 .82rem Manrope, sans-serif;
  color: rgba(61, 78, 47, .8);
}

.address svg {
  color: var(--gold);
  flex-shrink: 0;
}

.note,
.details {
  margin: 14px 0 0;
  font-size: 1.15rem;
  color: rgba(61, 78, 47, .85);
}

.info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 20px 0 0;
}

.info div {
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(230, 232, 216, .5);
}

.info dt {
  font: 600 .58rem Manrope, sans-serif;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--gold);
}

.info dd {
  margin: 4px 0 0;
  font-size: 1.05rem;
  color: var(--petrol);
}

.maps-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  padding: 9px 16px;
  border: 1px solid rgba(61, 78, 47, .22);
  border-radius: 999px;
  font: 600 .62rem Manrope, sans-serif;
  letter-spacing: .12em;
  text-transform: uppercase;
  color: var(--petrol);
  text-decoration: none;
  transition: background .2s, border-color .2s, color .2s;
}

.maps-link:hover {
  background: var(--petrol);
  border-color: var(--petrol);
  color: var(--ivory);
}

@media (max-width: 560px) {
  .event {
    grid-template-columns: 52px 1fr;
    gap: 12px;
  }

  .time {
    font-size: .7rem;
    letter-spacing: .04em;
  }

  .card-body {
    padding: 22px 20px;
  }

  .card-title {
    font-size: 1.5rem;
  }
}
</style>
