<script setup>
import ProgramTimeline from './ProgramTimeline.vue'
import { wedding } from '@/config/wedding'
</script>

<template>
  <section id="programma" class="program">
    <div class="container">
      <div v-reveal class="section-head">
        <span class="section-index">03 — Programma</span>
        <h2>Il grande giorno.</h2>
        <p class="program-date">{{ wedding.program.day }} <strong>{{ wedding.dateLong }}</strong></p>
      </div>

      <ProgramTimeline />

      <div class="program-more">
        <RouterLink class="btn" to="/programma">Tutti i dettagli della giornata</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.program {
  padding: 110px 0;
}

.program-date {
  margin: 14px 0 0;
  font-size: 1.25rem;
  color: rgba(61, 78, 47, .8);
}

.program-date strong {
  font-weight: 600;
  color: var(--petrol);
}

.program-more {
  margin-top: 16px;
  text-align: center;
}

@media (max-width: 720px) {
  .program {
    padding: 80px 0;
  }
}
</style>
