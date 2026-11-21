<script setup>
import { wedding } from '@/config/wedding'

const pad = n => String(n).padStart(2, '0')
</script>

<template>
  <section id="home" class="hero">
    <div class="hero-copy">
      <img :src="wedding.hero.logoHero" :alt="wedding.hero.logoAlt" class="hero-logo" fetchpriority="high">
      <!--<h1><span>{{ wedding.couple[0] }}</span><i>&amp;</i><span>{{ wedding.couple[1] }}</span></h1>-->
      <div class="hero-date">{{ wedding.dateShort }}</div>
      <div class="hero-actions">
        <RouterLink class="btn primary" to="/rsvp">Conferma la tua presenza</RouterLink>
        <!--<span class="hero-note">{{ wedding.hero.note }}</span>-->
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-panel">
        <div class="hero-monogram"><img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt"></div>
      </div>
    </div>
    <div class="venue-strip">
      <a
        v-for="(place, i) in wedding.places"
        :key="place.id"
        class="venue-mini"
        :href="'#' + place.id"
      >
        <span class="venue-no">{{ pad(i + 1) }}</span>
        <span><small>{{ place.label }} · {{ place.time }}</small><strong>{{ place.stripName }}</strong></span>
      </a>
    </div>
  </section>
</template>
