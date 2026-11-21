<script setup>
import { wedding } from '@/config/wedding'
</script>

<template>
  <footer>
    <div class="footer-mark"><img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt"></div>
    <div class="footer-names">{{ wedding.names }}</div>
    <div class="footer-date">{{ wedding.dateLong }} · {{ wedding.city }}</div>
  </footer>
</template>
