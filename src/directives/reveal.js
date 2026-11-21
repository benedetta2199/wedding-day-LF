// v-reveal: aggiunge la classe .reveal e la rende .visible quando entra nel viewport.
let observer

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      }),
      { threshold: 0.12 }
    )
  }
  return observer
}

export const reveal = {
  beforeMount(el) {
    el.classList.add('reveal')
  },
  mounted(el) {
    if ('IntersectionObserver' in window) getObserver().observe(el)
    else el.classList.add('visible')
  },
  beforeUnmount(el) {
    observer?.unobserve(el)
  }
}
