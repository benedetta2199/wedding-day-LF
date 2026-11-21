<script setup>
import { wedding } from '@/config/wedding'

const { story } = wedding
</script>

<template>
  <section id="storia" class="story">
    <div class="container">
      <div v-reveal class="section-head">
        <span class="section-index">01 — Storia</span>
        <h2>Ogni strada ci ha portati fin qui.</h2>
      </div>
      <div class="story-grid">
        <figure v-reveal class="story-photo">
          <img :src="story.image" :alt="story.imageAlt" loading="lazy">
        </figure>
        <div v-reveal class="story-copy">
          <span class="eyebrow">{{ story.eyebrow }}</span>
          <div class="latin-quote"><span></span><em>{{ story.latin }}</em><span></span></div>
          <div class="quote">{{ story.quote }}</div>
          <p>{{ story.text }}</p>
          <div class="story-mark"></div>
        </div>
      </div>
    </div>
  </section>
</template>
