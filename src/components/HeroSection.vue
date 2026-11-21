<script setup>
import { wedding } from '@/config/wedding'

const pad = n => String(n).padStart(2, '0')
</script>

<template>
  <section id="home" class="hero">
    <div class="hero-copy">
      <!-- Colonna sinistra su desktop: invito e logo -->
      <div class="hero-col hero-col-names">
        <p class="hero-invite">{{ wedding.hero.invite }}</p>
        <img :src="wedding.hero.logoHero" :alt="wedding.hero.logoAlt" class="hero-logo" fetchpriority="high">
      </div>
      <!-- Colonna destra su desktop: foto, data e conferma -->
      <div class="hero-col hero-col-photo">
        <div class="hero-date">{{ wedding.dateShort }}</div>
        <figure class="hero-photo arch">
          <img :src="wedding.hero.photo" :alt="wedding.hero.photoAlt" fetchpriority="high">
        </figure>
        <!--<h1><span>{{ wedding.couple[0] }}</span><i>&amp;</i><span>{{ wedding.couple[1] }}</span></h1>-->
        <div class="hero-actions">
          <RouterLink class="btn primary" to="/rsvp">Conferma la tua presenza</RouterLink>
          <!--<span class="hero-note">{{ wedding.hero.note }}</span>-->
        </div>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-panel">
        <div class="hero-monogram"><img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt"></div>
      </div>
    </div>
  </section>

  <section class="venues" aria-label="I luoghi">
    <div class="venue-strip">
      <RouterLink
        v-for="(place, i) in wedding.places"
        :key="place.id"
        class="venue-mini"
        :class="`venue-${place.id}`"
        :to="{ path: '/programma', hash: '#' + place.id }"
      >
        <span class="venue-no">{{ pad(i + 1) }}</span>
        <span><small>{{ place.label }} · {{ place.time }}</small><strong>{{ place.stripName }}</strong></span>
      </RouterLink>
      <div class="venue-more">
        <RouterLink class="btn" to="/programma">Tutti i dettagli della giornata</RouterLink>
      </div>
    </div>
  </section>
</template>
