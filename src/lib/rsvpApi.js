import { RSVP_ENDPOINT } from '@/config/wedding'

// Chiamata all'Apps Script. Content-Type text/plain = richiesta "semplice":
// niente preflight CORS e risposta JSON leggibile.
export async function callScript(payload) {
  const response = await fetch(RSVP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  return response.json()
}

// Galleria, dal più recente:
//   photos   [{ id, t (data in ms), v (true se video) }]
//   messages [{ id, t, nome, testo }]
//   total    numero complessivo delle foto (la pagina ne contiene al massimo `limit`)
export async function fetchGallery({ offset = 0, limit } = {}) {
  const result = await callScript({ action: 'photos', offset, limit })
  if (!result.ok) throw new Error(result.error || 'unknown')
  const photos = result.photos || []
  // uno script vecchio, senza paginazione, restituisce tutto e niente `total`
  return { photos, total: result.total ?? offset + photos.length, messages: result.messages || [] }
}

// Pensiero agli sposi: restituisce il messaggio salvato.
export async function sendMessage(nome, testo) {
  const result = await callScript({ action: 'message', nome, testo })
  if (!result.ok) throw new Error(result.error || 'unknown')
  return result.message
}

// Caricamento di un file nella cartella Drive (tramite Apps Script).
// `pensiero` (facoltativo): dedica breve, mostrata sotto la foto come in una polaroid.
// `scattata` (facoltativo): data ISO dello scatto, quando la compressione ha tolto gli EXIF.
// Restituisce { id, message } (message = il pensiero salvato, oppure null).
export async function uploadPhoto(file, ospite, pensiero = '', scattata = null) {
  const dati = await toBase64(file)
  const result = await callScript({
    action: 'upload',
    nome: file.name,
    mime: file.type,
    ospite,
    pensiero,
    scattata: scattata || '',
    dati
  })
  if (!result.ok) throw new Error(result.error || 'unknown')
  return { id: result.id, message: result.message || null }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export class AdminError extends Error {
  constructor(code) {
    super(code)
    this.code = code // unauthorized | not_configured | network | altro messaggio
  }
}

export async function fetchAdminRows(password) {
  let result
  try {
    result = await callScript({ action: 'admin', password })
  } catch {
    throw new AdminError('network')
  }
  if (!result.ok) throw new AdminError(result.error || 'unknown')
  return { rows: result.rows, updatedAt: result.aggiornato }
}
