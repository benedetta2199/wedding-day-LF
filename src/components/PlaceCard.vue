<script setup>
defineProps({
  place: { type: Object, required: true },
  index: { type: Number, required: true }
})

const pad = n => String(n).padStart(2, '0')
</script>

<template>
  <article :id="place.id" v-reveal class="place-row" :class="{ reverse: place.reverse }">
    <div class="place-gallery">
      <img
        v-for="img in place.gallery"
        :key="img.src"
        :class="img.cls"
        :src="img.src"
        :alt="img.alt"
        loading="lazy"
      >
    </div>
    <div class="place-card">
      <span class="number">{{ pad(index + 1) }} / {{ place.label.toUpperCase() }}</span>
      <h3>{{ place.title[0] }}<br>{{ place.title[1] }}</h3>
      <p>{{ place.text }}</p>
      <div class="facts">
        <div v-for="[label, value] in place.facts" :key="label" class="fact">
          <small>{{ label }}</small><strong>{{ value }}</strong>
        </div>
      </div>
      <a class="btn" target="_blank" rel="noopener" :href="place.map">Apri la mappa</a>
    </div>
  </article>
</template>
