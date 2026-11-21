// Export CSV per Excel italiano: separatore ";", BOM UTF-8 per gli accenti
// e protezione dalle "formula injection" (celle che iniziano con = + - @).

const COLUMNS = [
  ['data', 'Data', v => (v ? new Date(v).toLocaleString('it-IT') : '')],
  ['id', 'ID risposta'],
  ['tipo', 'Tipo'],
  ['nome', 'Nome'],
  ['cognome', 'Cognome'],
  ['presenza', 'Presenza'],
  ['riferimento', 'Riferimento'],
  ['celiaco', 'Celiaco'],
  ['vegetariano', 'Vegetariano'],
  ['vegano', 'Vegano'],
  ['altro', 'Altro'],
  ['note', 'Note']
]

function escapeCell(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'sì' : 'no'
  let s = String(value)
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s
  if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'
  return s
}

export function toCsv(rows) {
  const header = COLUMNS.map(([, label]) => escapeCell(label)).join(';')
  const lines = rows.map(row =>
    COLUMNS.map(([key, , format]) => escapeCell(format ? format(row[key]) : row[key])).join(';')
  )
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(rows, filename) {
  const blob = new Blob(['﻿' + toCsv(rows)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
