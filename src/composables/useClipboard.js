import { ref } from 'vue'

export function useClipboard(resetAfter = 2200) {
  const copied = ref(false)
  let timer

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      area.remove()
    }
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), resetAfter)
  }

  return { copied, copy }
}
