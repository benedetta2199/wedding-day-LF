<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { wedding } from '@/config/wedding'

const links = [
  { to: '/', label: 'Home' },
  { to: '/programma', label: 'Programma' }
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

// Il router ignora i click verso l'URL corrente: in quel caso torniamo in cima a mano.
function follow(path) {
  open.value = false
  if (route.path === path) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <header class="nav" :class="{ compact }">
    <div class="nav-inner">
      <RouterLink
        class="brand"
        to="/"
        aria-label="Torna all'inizio"
        @click="follow('/')"
      >
        <img class="site-logo" :src="wedding.logo" :alt="wedding.logoAlt">
      </RouterLink>
      <nav id="menu" class="menu" :class="{ open }">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          @click="follow(link.to)"
        >{{ link.label }}</RouterLink>
        <RouterLink class="nav-rsvp" to="/rsvp" @click="follow('/rsvp')">Conferma la tua presenza</RouterLink>
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
