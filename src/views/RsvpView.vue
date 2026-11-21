<script setup>
import RsvpForm from '@/components/RsvpForm.vue'
import { wedding } from '@/config/wedding'
</script>

<template>
  <main class="page">
    <section id="rsvp" class="rsvp rsvp-page">
      <div class="container">
        <div v-reveal class="invite">
          <aside class="invite-side">
            <div class="invite-monogram"><img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt"></div>
            <p>Il regalo più bello sarà condividere questa giornata con voi.</p>
            <span class="eyebrow">{{ wedding.dateShort }}</span>
          </aside>
          <div class="invite-form">
            <RsvpForm />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

