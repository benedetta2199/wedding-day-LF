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
