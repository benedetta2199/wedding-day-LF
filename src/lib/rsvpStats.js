// Calcoli della dashboard a partire dalle righe del foglio (una riga per persona).

export function groupResponses(rows) {
  const byId = new Map()
  for (const row of rows) {
    if (!byId.has(row.id)) byId.set(row.id, { id: row.id, data: row.data, main: null, guests: [] })
    const group = byId.get(row.id)
    if (row.tipo === 'Principale' && !group.main) group.main = row
    else group.guests.push(row)
  }
  // Se manca il principale (riga cancellata a mano) promuoviamo il primo invitato.
  for (const group of byId.values()) {
    if (!group.main) group.main = group.guests.shift()
  }
  return [...byId.values()].sort((a, b) => String(b.data).localeCompare(String(a.data)))
}

export function computeStats(rows) {
  const present = rows.filter(r => r.presenza)
  const groups = groupResponses(rows)
  return {
    responses: groups.length,
    people: rows.length,
    present: present.length,
    absent: rows.length - present.length,
    companions: rows.filter(r => r.tipo !== 'Principale').length,
    diets: [
      { key: 'celiaco', label: 'Celiaci', count: present.filter(r => r.celiaco).length },
      { key: 'vegetariano', label: 'Vegetariani', count: present.filter(r => r.vegetariano).length },
      { key: 'vegano', label: 'Vegani', count: present.filter(r => r.vegano).length },
      { key: 'altro', label: 'Altro', count: present.filter(r => r.altro).length }
    ],
    otherDiets: present.filter(r => r.altro),
    notes: rows.filter(r => r.note),
    lastResponse: groups[0]?.data || null
  }
}

export function dietSummary(person) {
  if (!person.presenza) return ''
  const list = []
  if (person.celiaco) list.push('Celiaco')
  if (person.vegetariano) list.push('Vegetariano')
  if (person.vegano) list.push('Vegano')
  if (person.altro) list.push(person.altro)
  return list.join(', ')
}

export const formatDate = value =>
  value
    ? new Date(value).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'
