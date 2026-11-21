<script setup>
import AppIcon from './AppIcon.vue'
import { wedding } from '@/config/wedding'

// Solo l'essenziale di ogni momento: orario, titolo, luogo e una nota breve.
// Indirizzi, durata, mappe e parcheggi stanno nelle sezioni dei luoghi più sotto.
const events = wedding.program.events.map(event => {
  const place = wedding.places.find(p => p.id === event.placeId)
  return {
    ...event,
    photo: event.photo || place?.gallery?.[0],
    hasSection: Boolean(place)
  }
})
</script>

<template>
  <ol class="timeline">
    <li
      v-for="(event, i) in events"
      :id="`ora-${event.id}`"
      :key="event.id"
      class="moment"
      :class="{ flip: i % 2 === 1 }"
    >
      <figure v-if="event.photo" class="moment-photo arch">
        <img :src="event.photo.src" :alt="event.photo.alt" loading="lazy">
      </figure>

      <div class="moment-card">
        <p class="moment-time">
          <AppIcon :name="event.icon" :size="18" />
          <span class="num">{{ event.time }}</span>
        </p>
        <h3>{{ event.title }}</h3>
        <p v-if="event.place" class="moment-place">{{ event.place }}</p>
        <p v-if="event.note" class="moment-note">{{ event.note }}</p>
        <a v-if="event.hasSection" class="moment-link" :href="`#${event.placeId}`">
          Dettagli e parcheggi<AppIcon name="chevron" :size="16" />
        </a>
      </div>
    </li>
  </ol>
</template>

<style scoped>
/* ---------- Mobile: righe compatte, miniatura ad arco a sinistra ---------- */
.timeline {
  list-style: none;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;
}

.moment {
  display: grid;
  grid-template-columns: 96px 1fr;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
  border-top: 1px solid var(--line);
}

.moment:last-child {
  border-bottom: 1px solid var(--line);
}

.moment-photo {
  margin: 0;
  aspect-ratio: 4 / 5;
}

.moment-card {
  min-width: 0;
}

.moment-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--fede-ink);
}

.moment-time .num {
  font-size: 1.625rem;
  font-weight: 500;
  line-height: 1;
}

.moment-card h3 {
  margin-top: 4px;
  font-size: 1.5rem;
  font-weight: 500;
  line-height: 1.15;
}

.moment-place {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 1.125rem;
  line-height: 1.3;
  color: var(--oliva-soft);
}

.moment-note {
  margin-top: 4px;
  font-size: .9375rem;
  color: var(--oliva-soft);
}

.moment-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin-bottom: -10px;
  font-size: .9375rem;
  font-weight: 500;
  color: var(--erba);
  text-decoration: underline;
  text-decoration-color: var(--fede);
  text-underline-offset: 4px;
}

/* ---------- Desktop: linea centrale, foto e testo alternati ---------- */
@media (min-width: 960px) {
  .timeline {
    position: relative;
  }

  .timeline::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: linear-gradient(transparent, var(--erba) 10%, var(--erba) 90%, transparent);
  }

  .moment,
  .moment:last-child {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "photo card";
    gap: 0 112px;
    padding: 32px 0;
    border: 0;
  }

  .moment.flip {
    grid-template-areas: "card photo";
  }

  .moment-photo {
    grid-area: photo;
    justify-self: end;
    width: 300px;
  }

  .moment.flip .moment-photo {
    justify-self: start;
  }

  .moment-card {
    grid-area: card;
  }

  .moment.flip .moment-card {
    text-align: right;
  }

  .moment.flip .moment-time {
    justify-content: flex-end;
  }

  .moment-time .num {
    font-size: 2.25rem;
  }

  .moment-card h3 {
    font-size: 2.25rem;
  }

  .moment-place {
    font-size: 1.375rem;
  }
}
</style>
