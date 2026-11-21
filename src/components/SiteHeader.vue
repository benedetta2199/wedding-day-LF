<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { wedding } from '@/config/wedding'

const links = [
  { hash: '#storia', label: 'La nostra storia' },
  { hash: '#cerimonia', label: 'Cerimonia' },
  { hash: '#ricevimento', label: 'Ricevimento' },
  { hash: '#programma', label: 'Programma' },
  { hash: '#regalo', label: 'Regalo' }
]

const route = useRoute()
const compact = ref(false)
const open = ref(false)

const onScroll = () => (compact.value = window.scrollY > 30)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

watch(() => route.fullPath, () => (open.value = false))

// Il router ignora i click verso l'URL corrente: in quel caso scorriamo a mano.
function follow(hash) {
  open.value = false
  if (route.path === '/' && route.hash === hash) {
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <header class="nav" :class="{ compact }">
    <div class="nav-inner">
      <RouterLink
        class="brand"
        :to="{ path: '/', hash: '#home' }"
        aria-label="Torna all'inizio"
        @click="follow('#home')"
      >
        <img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt">
      </RouterLink>
      <nav id="menu" class="menu" :class="{ open }">
        <RouterLink
          v-for="link in links"
          :key="link.hash"
          :to="{ path: '/', hash: link.hash }"
          @click="follow(link.hash)"
        >{{ link.label }}</RouterLink>
        <RouterLink class="nav-rsvp" to="/rsvp">RSVP</RouterLink>
      </nav>
      <button
        class="hamb"
        type="button"
        :aria-label="open ? 'Chiudi il menu' : 'Apri il menu'"
        :aria-expanded="open"
        aria-controls="menu"
        @click="open = !open"
      >☰</button>
    </div>
  </header>
</template>
