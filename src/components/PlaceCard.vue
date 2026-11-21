<script setup>
import AppIcon from './AppIcon.vue'

// Scheda di un luogo nella pagina Programma: solo testo, le foto stanno nella timeline.
defineProps({
  place: { type: Object, required: true }
})
</script>

<template>
  <article class="place">
    <div class="place-intro">
      <h3>{{ place.title.join(' ') }}</h3>
      <p class="place-text">{{ place.text }}</p>
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
  </article>
</template>

<style scoped>
.place {
  display: grid;
  grid-template-areas: "intro" "facts" "map";
  gap: 22px;
  max-width: 960px;
  margin: 0 auto;
}

.place-intro h3 {
  font-size: clamp(2rem, 9vw, 2.75rem);
  font-weight: 500;
}

.place-text {
  margin-top: 10px;
  color: var(--oliva-soft);
}

.place-intro {
  grid-area: intro;
}

.place-map {
  grid-area: map;
  align-self: start;
  width: 100%;
}

.facts {
  grid-area: facts;
  margin: 0;
  border-radius: 20px;
  /*background: */
  border: 1px solid var(--erba);
  padding: 6px 18px;
}

.fact {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 12px;
  padding: 12px 0;
}

.fact + .fact {
  border-top: 1px solid var(--line);
}

.fact dt {
  font-size: .75rem;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  line-height: 1.9;
  color: var(--erba);
}

.fact dd {
  margin: 0;
}

@media (min-width: 600px) {
  .place-map {
    justify-self: start;
    width: auto;
  }
}

@media (min-width: 960px) {
  .place {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "intro facts" "map facts";
    grid-template-rows: auto 1fr;
    gap: 24px 64px;
  }

  .facts {
    align-self: start;
    padding: 10px 28px;
  }
}
</style>
