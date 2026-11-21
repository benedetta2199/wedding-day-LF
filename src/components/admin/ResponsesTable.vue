<script setup>
import { computed, ref } from 'vue'
import { groupResponses, dietSummary, formatDate } from '@/lib/rsvpStats'

const props = defineProps({
  rows: { type: Array, required: true }
})

const query = ref('')
const filter = ref('all') // all | present | absent

const normalize = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const groups = computed(() => {
  const q = normalize(query.value.trim())
  return groupResponses(props.rows).filter(group => {
    const people = [group.main, ...group.guests]
    if (filter.value === 'present' && !group.main.presenza) return false
    if (filter.value === 'absent' && group.main.presenza) return false
    if (!q) return true
    return people.some(p => normalize(`${p.nome} ${p.cognome}`).includes(q))
  })
})

const fullName = p => `${p.nome} ${p.cognome}`
</script>

<template>
  <div class="responses">
    <div class="toolbar">
      <input v-model="query" type="search" placeholder="Cerca per nome o cognome…" aria-label="Cerca invitato">
      <div class="segmented" role="group" aria-label="Filtra per presenza">
        <button type="button" :class="{ on: filter === 'all' }" @click="filter = 'all'">Tutte</button>
        <button type="button" :class="{ on: filter === 'present' }" @click="filter = 'present'">Ci sono</button>
        <button type="button" :class="{ on: filter === 'absent' }" @click="filter = 'absent'">Non ci sono</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Ricevuta</th>
            <th scope="col">Invitato</th>
            <th scope="col">Risposta</th>
            <th scope="col">Accompagnatori</th>
            <th scope="col">Esigenze alimentari</th>
            <th scope="col">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in groups" :key="g.id">
            <td class="nowrap muted">{{ formatDate(g.data) }}</td>
            <td class="strong">{{ fullName(g.main) }}</td>
            <td>
              <span class="badge" :class="g.main.presenza ? 'yes' : 'no'">
                {{ g.main.presenza ? '✓ Ci sono' : '✕ Non ci sono' }}
              </span>
            </td>
            <td>
              <span v-if="!g.guests.length" class="muted">—</span>
              <ul v-else class="people">
                <li v-for="p in g.guests" :key="fullName(p)">{{ fullName(p) }}</li>
              </ul>
            </td>
            <td>
              <ul class="people">
                <li v-for="p in [g.main, ...g.guests].filter(dietSummary)" :key="fullName(p)">
                  <span class="muted">{{ p.nome }}:</span> {{ dietSummary(p) }}
                </li>
              </ul>
            </td>
            <td>
              <ul class="people">
                <li v-for="p in [g.main, ...g.guests].filter(x => x.note)" :key="fullName(p)">
                  <span class="muted">{{ p.nome }}:</span> {{ p.note }}
                </li>
              </ul>
            </td>
          </tr>
          <tr v-if="!groups.length">
            <td colspan="6" class="empty">Nessuna risposta corrisponde alla ricerca.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

input[type="search"] {
  flex: 1 1 240px;
  max-width: 360px;
  padding: 10px 14px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  background: #fff;
  font: inherit;
  font-size: .9rem;
  color: var(--admin-ink);
}

input[type="search"]:focus {
  outline: 2px solid var(--admin-present);
  outline-offset: 1px;
}

.segmented {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  background: #fff;
}

.segmented button {
  padding: 7px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  font: inherit;
  font-size: .82rem;
  color: var(--admin-ink-2);
  cursor: pointer;
}

.segmented button.on {
  background: var(--admin-ink);
  color: #fff;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  background: #fff;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: .86rem;
}

th {
  padding: 11px 14px;
  border-bottom: 1px solid var(--admin-line);
  background: var(--admin-surface-2);
  font-size: .7rem;
  font-weight: 600;
  letter-spacing: .06em;
  text-align: left;
  text-transform: uppercase;
  color: var(--admin-muted);
  white-space: nowrap;
}

td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--admin-line);
  vertical-align: top;
  color: var(--admin-ink);
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover td {
  background: var(--admin-surface-2);
}

.people {
  display: grid;
  gap: 3px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: .76rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.yes {
  background: rgba(93, 122, 53, .14);
  color: #3f5522;
}

.badge.no {
  background: rgba(196, 138, 44, .16);
  color: #7a5214;
}

.strong {
  font-weight: 600;
}

.nowrap {
  white-space: nowrap;
}

.muted {
  color: var(--admin-muted);
}

.empty {
  padding: 28px;
  text-align: center;
  color: var(--admin-muted);
}
</style>
