<script setup>
import { wedding } from '@/config/wedding'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true }
})
</script>

<template>
  <main class="grazie-page">
    <div class="grazie-logo"><img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt"></div>
    <div class="grazie-divider" aria-hidden="true"><span>♡</span></div>
    <h1>{{ title }}</h1>
    <p class="subtitle">{{ subtitle }}</p>
    <RouterLink class="btn primary" to="/">Torna alla home</RouterLink>
  </main>
</template>
