import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { wedding } from '@/config/wedding'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: `${wedding.names} — ${wedding.dateLong}` }
  },
  {
    path: '/rsvp',
    name: 'rsvp',
    component: () => import('@/views/RsvpView.vue'),
    meta: {
      title: `RSVP — ${wedding.names}`,
      description: `Conferma la tua presenza al matrimonio di Simone e Manuela — ${wedding.dateLong}, ${wedding.city}.`
    }
  },
  {
    path: '/programma',
    name: 'programma',
    component: () => import('@/views/ProgramView.vue'),
    meta: {
      title: `Programma — ${wedding.names}`,
      description: `Orari, luoghi e informazioni utili per il matrimonio di Simone e Manuela — ${wedding.dateLong}, ${wedding.city}.`
    }
  },
  {
    path: '/grazie',
    name: 'grazie',
    component: () => import('@/views/ThanksView.vue'),
    meta: { title: `Grazie — ${wedding.names}` }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { title: `Area sposi — ${wedding.names}`, bare: true, noindex: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: `Pagina non trovata — ${wedding.names}` }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

const defaultDescription = `Il matrimonio di Simone e Manuela — ${wedding.dateLong}, ${wedding.city}.`

router.afterEach(to => {
  document.title = to.meta.title || wedding.names
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute('content', to.meta.description || defaultDescription)

  // Pagine private (es. /admin): fuori dai motori di ricerca.
  let robots = document.querySelector('meta[name="robots"]')
  if (to.meta.noindex) {
    if (!robots) {
      robots = document.createElement('meta')
      robots.name = 'robots'
      document.head.appendChild(robots)
    }
    robots.content = 'noindex, nofollow'
  } else {
    robots?.remove()
  }
})

export default router
