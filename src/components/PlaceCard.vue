<script setup>
import AppIcon from './AppIcon.vue'

// Scheda di un luogo nella pagina Programma: solo testo, le foto stanno nella timeline.
defineProps({
  place: { type: Object, required: true }
})
</script>

<template>
  <div class="place">
    <div class="place-intro">
      <h3 :id="`titolo-${place.id}`">{{ place.title.join(' ') }}</h3>
      <p v-if="place.text" class="place-text">{{ place.text }}</p>
    </div>

    <dl class="facts">
      <div v-for="[label, value] in place.facts" :key="label" class="fact">
        <dt>{{ label }}</dt>
        <dd>{{ value }}</dd>
      </div>
    </dl>

    <a class="btn primary place-map" target="_blank" rel="noopener noreferrer" :href="place.map">
      <AppIcon name="pin" :size="18" />Apri la mappa
    </a>
  </div>
</template>

<style scoped>
/* Mobile: nome e testo centrati, dati a tessere, mappa a tutta larghezza */
.place {
  display: grid;
  grid-template-areas: "intro" "facts" "map";
  gap: 24px;
}

.place-intro {
  grid-area: intro;
  text-align: center;
}

.place-intro h3 {
  font-size: clamp(2.5rem, 11vw, 3.5rem);
  line-height: 1.05;
}

.place-text {
  max-width: 34rem;
  margin: 12px auto 0;
  color: var(--oliva-soft);
}

.facts {
  grid-area: facts;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin: 0;
}

.fact {
  display: grid;
  align-content: start;
  gap: 4px;
  padding: 14px 14px 16px;
  border-radius: 18px;
  background: linear-gradient(160deg, rgba(200, 205, 170, .5), rgba(235, 201, 160, .22));
}

.fact dt {
  font-size: .6875rem;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--erba);
}

.fact dd {
  margin: 0;
  font-size: .9375rem;
  line-height: 1.4;
  color: var(--oliva);
}

.place-map {
  grid-area: map;
  align-self: start;
  width: 100%;
}

@media (min-width: 600px) {
  .facts {
    gap: 12px;
  }

  .fact {
    padding: 16px 18px 18px;
  }

  .place-map {
    justify-self: center;
    width: auto;
  }
}

/* Desktop: a sinistra nome, testo e mappa; a destra le tessere dei dati */
@media (min-width: 960px) {
  .place {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "intro facts" "map facts";
    grid-template-rows: auto 1fr;
    gap: 24px 56px;
  }

  .place-intro {
    text-align: left;
  }

  .place-text {
    margin-left: 0;
  }

  .place-map {
    justify-self: start;
  }

  .facts {
    align-self: center;
  }
}
</style>
