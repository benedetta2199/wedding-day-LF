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

// Galleria: [{ id, t (data in ms), v (true se video) }], dalla più recente.
export async function fetchPhotos() {
  const result = await callScript({ action: 'photos' })
  if (!result.ok) throw new Error(result.error || 'unknown')
  return result.photos
}

// Caricamento di un file nella cartella Drive (tramite Apps Script).
export async function uploadPhoto(file, ospite) {
  const dati = await toBase64(file)
  const result = await callScript({ action: 'upload', nome: file.name, mime: file.type, ospite, dati })
  if (!result.ok) throw new Error(result.error || 'unknown')
  return result.id
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
