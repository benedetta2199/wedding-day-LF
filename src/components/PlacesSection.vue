<script setup>
import PlaceCard from './PlaceCard.vue'
import { wedding } from '@/config/wedding'
</script>

<template>
  <section class="places">
    <div class="container">
      <div v-reveal class="section-head">
        <span class="section-index">02 — Luoghi</span>
        <h2>Due luoghi, un unico giorno.</h2>
      </div>
      <PlaceCard v-for="(place, i) in wedding.places" :key="place.id" :place="place" :index="i" />
    </div>
  </section>
</template>
