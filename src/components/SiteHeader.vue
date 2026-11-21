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
const onKey = e => e.key === 'Escape' && (open.value = false)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
})

watch(() => route.fullPath, () => (open.value = false))

// Il router ignora i click verso l'URL corrente: in quel caso torniamo in cima a mano.
function follow(path) {
  open.value = false
  if (route.path === path) window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <header class="site-header" :class="{ compact, open }">
    <div class="bar">
      <RouterLink class="brand" to="/" aria-label="Lucia e Filippo, torna alla home" @click="follow('/')">
        <img class="brand-logo" :src="wedding.logo" alt="" width="52" height="52">
        <span class="brand-names" aria-hidden="true">{{ wedding.names }}</span>
      </RouterLink>

      <!-- Desktop: navigazione allineata a destra -->
      <nav class="links" aria-label="Menu principale">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="link"
          @click="follow(link.to)"
        >{{ link.label }}</RouterLink>
        <RouterLink class="cta" to="/rsvp" @click="follow('/rsvp')">Conferma la tua presenza</RouterLink>
      </nav>

      <!-- Mobile: due linee sottili che diventano una X -->
      <button
        class="toggle"
        type="button"
        :aria-label="open ? 'Chiudi il menu' : 'Apri il menu'"
        :aria-expanded="open"
        aria-controls="menu-mobile"
        @click="open = !open"
      >
        <span></span><span></span>
      </button>
    </div>

    <!-- Mobile: pannello che scende sotto la barra -->
    <nav id="menu-mobile" class="sheet" aria-label="Menu principale" :inert="open ? undefined : ''">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="sheet-link"
        @click="follow(link.to)"
      >{{ link.label }}</RouterLink>
      <RouterLink class="sheet-cta" to="/rsvp" @click="follow('/rsvp')">Conferma la tua presenza</RouterLink>
    </nav>
  </header>

  <div class="scrim" :class="{ show: open }" aria-hidden="true" @click="open = false"></div>
</template>

<style scoped>
/* ---------- Barra (mobile: minimal) ---------- */
.site-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  font-family: var(--font-body);
}

.bar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 64px;
  padding: 0 10px 0 18px;
  border-bottom: 1px solid transparent;
  background: rgba(246, 241, 231, .78);
  -webkit-backdrop-filter: blur(14px);
  backdrop-filter: blur(14px);
  transition: height .3s var(--ease), background-color .3s, border-color .3s, box-shadow .3s;
}

.compact .bar,
.open .bar {
  border-bottom-color: rgba(107, 113, 72, .18);
  background: rgba(246, 241, 231, .96);
}

/* ---------- Logo (i nomi compaiono solo su desktop) ---------- */
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  color: var(--oliva);
}

.brand-logo {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  object-fit: contain;
  transition: width .3s var(--ease), height .3s var(--ease);
}

.brand-names {
  display: none;
  font-family: var(--font-title);
  font-size-adjust: .42;
  line-height: 1;
  white-space: nowrap;
  padding-top: 4px;
}

/* ---------- Pulsante menu: due linee, nessuna cornice ---------- */
.toggle {
  position: relative;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--oliva);
}

.toggle span {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 1px;
  margin-left: -11px;
  background: currentColor;
  transition: transform .3s var(--ease);
}

.toggle span:nth-child(1) { transform: translateY(-4px); }
.toggle span:nth-child(2) { transform: translateY(4px); }

.open .toggle span:nth-child(1) { transform: rotate(45deg); }
.open .toggle span:nth-child(2) { transform: rotate(-45deg); }

/* ---------- Pannello mobile: piatto e sobrio ---------- */
.sheet {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1;
  display: grid;
  padding: 4px 18px 22px;
  border-bottom: 1px solid rgba(107, 113, 72, .18);
  background: var(--foglia);
  visibility: hidden;
  opacity: 0;
  transform: translateY(-6px);
  transition: opacity .2s var(--ease), transform .25s var(--ease), visibility 0s .25s;
}

.open .sheet {
  visibility: visible;
  opacity: 1;
  transform: none;
  transition: opacity .2s var(--ease), transform .25s var(--ease);
}

.sheet-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  border-bottom: 1px solid rgba(107, 113, 72, .14);
  font-size: .75rem;
  font-weight: 500;
  letter-spacing: .2em;
  text-transform: uppercase;
  color: var(--oliva);
}

/* voce attiva: puntino verde */
.sheet-link.router-link-exact-active::after {
  content: "";
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--erba);
}

.sheet-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin-top: 18px;
  border: 1px solid var(--oliva);
  border-radius: 999px;
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--oliva);
  transition: background-color .2s, color .2s;
}

.sheet-cta:active,
.sheet-cta:hover {
  background: var(--oliva);
  color: var(--carta);
}

.scrim {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(46, 50, 34, .12);
  opacity: 0;
  pointer-events: none;
  transition: opacity .25s;
}

.scrim.show {
  opacity: 1;
  pointer-events: auto;
}

/* ---------- Navigazione desktop ---------- */
.links {
  display: none;
}

@media (min-width: 900px) {
  .bar {
    height: var(--header-h);
    padding: 0 max(32px, (100% - 1240px) / 2);
  }

  .compact .bar {
    height: 66px;
    box-shadow: 0 12px 30px -22px rgba(46, 50, 34, .45);
  }

  .compact .brand-logo {
    width: 44px;
    height: 44px;
  }

  .brand-logo {
    width: 54px;
    height: 54px;
  }

  .brand-names {
    display: inline;
    font-size: 2rem;
  }

  .toggle,
  .sheet,
  .scrim {
    display: none;
  }

  /* a destra: voci e pulsante di conferma */
  .links {
    display: flex;
    align-items: center;
    gap: 34px;
    margin-left: auto;
  }

  .link {
    position: relative;
    padding: 10px 0;
    font-size: .75rem;
    font-weight: 600;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: var(--oliva);
  }

  /* sottolineatura che cresce al passaggio */
  .link::after {
    content: "";
    position: absolute;
    left: 50%;
    right: 50%;
    bottom: 2px;
    height: 1px;
    background: var(--erba);
    transition: left .25s var(--ease), right .25s var(--ease);
  }

  .link:hover::after {
    left: 0;
    right: 0;
  }

  /* voce attiva: puntino verde sotto */
  .link.router-link-exact-active::before {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -6px;
    width: 5px;
    height: 5px;
    margin-left: -2.5px;
    border-radius: 50%;
    background: var(--erba);
  }

  .cta {
    display: inline-flex;
    align-items: center;
    min-height: 46px;
    padding: 0 24px;
    border: 1px solid var(--oliva);
    border-radius: 999px;
    background: var(--oliva);
    font-size: .72rem;
    font-weight: 600;
    letter-spacing: .16em;
    text-transform: uppercase;
    color: var(--carta);
    transition: background-color .2s, border-color .2s, color .2s;
  }

  .cta:hover {
    border-color: var(--bosco);
    background: var(--bosco);
  }

  .cta.router-link-exact-active {
    background: transparent;
    color: var(--oliva);
  }
}

</style>
