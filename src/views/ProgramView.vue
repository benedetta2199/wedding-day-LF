<script setup>
import ProgramTimeline from '@/components/ProgramTimeline.vue'
import { wedding } from '@/config/wedding'

const { program } = wedding
</script>

<template>
  <main class="program-page">
    <section class="program-intro">
      <div class="container">
        <div v-reveal class="section-head">
          <span class="section-index">Programma</span>
          <h1>Il grande giorno.</h1>
          <p class="program-date">{{ program.day }} <strong>{{ wedding.dateLong }}</strong> · {{ wedding.city }}</p>
          <p class="program-lead">
            Tutto quello che serve sapere per vivere la giornata con noi: orari, luoghi e qualche informazione pratica.
          </p>
        </div>
      </div>
    </section>

    <section class="program-timeline" aria-label="Orari della giornata">
      <div class="container">
        <ProgramTimeline extended />
      </div>
    </section>

    <section class="program-practical" aria-labelledby="info-utili">
      <div class="container">
        <div v-reveal class="section-head">
          <span class="section-index">Info utili</span>
          <h2 id="info-utili">Da sapere.</h2>
        </div>
        <div class="practical-grid">
          <article v-for="item in program.practical" :key="item.title" v-reveal class="practical-card">
            <span class="practical-icon" aria-hidden="true">{{ item.icon }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="program-cta">
      <div v-reveal class="container">
        <h2>Sarete con noi?</h2>
        <RouterLink class="btn primary" to="/rsvp">Conferma la tua presenza</RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.program-intro {
  padding: 150px 0 50px;
  text-align: center;
}

.program-intro h1 {
  margin: 10px 0 0;
  font-size: clamp(3rem, 7vw, 5rem);
  font-weight: 400;
  line-height: 1;
}

.program-date {
  margin: 18px 0 0;
  font-size: 1.3rem;
  color: rgba(61, 78, 47, .8);
}

.program-date strong {
  font-weight: 600;
  color: var(--petrol);
}

.program-lead {
  max-width: 560px;
  margin: 18px auto 0;
  font-size: 1.15rem;
  color: rgba(61, 78, 47, .75);
}

.program-timeline {
  padding: 30px 0 70px;
}

.program-practical {
  padding: 70px 0;
  background: rgba(230, 232, 216, .45);
}

.practical-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  max-width: 1000px;
  margin: 0 auto;
}

.practical-card {
  padding: 28px;
  border: 1px solid rgba(122, 112, 64, .28);
  border-radius: 22px;
  background: var(--ivory);
}

.practical-icon {
  font-size: 1.5rem;
}

.practical-card h3 {
  margin: 12px 0 6px;
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--petrol);
}

.practical-card p {
  margin: 0;
  font-size: 1.08rem;
  color: rgba(61, 78, 47, .8);
}

.program-cta {
  padding: 90px 0 110px;
  text-align: center;
}

.program-cta h2 {
  margin: 0 0 26px;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  font-weight: 400;
}

@media (max-width: 720px) {
  .program-intro {
    padding: 120px 0 30px;
  }

  .program-practical {
    padding: 56px 0;
  }
}
</style>
