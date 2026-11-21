<script setup>
import { computed, onMounted, ref } from 'vue'
import AttendanceBar from '@/components/admin/AttendanceBar.vue'
import DietChart from '@/components/admin/DietChart.vue'
import ResponsesTable from '@/components/admin/ResponsesTable.vue'
import { fetchAdminRows } from '@/lib/rsvpApi'
import { computeStats, formatDate } from '@/lib/rsvpStats'
import { downloadCsv } from '@/lib/csv'
import { wedding } from '@/config/wedding'

const STORAGE_KEY = 'smAdminPassword'

const password = ref('')
const rows = ref(null)
const updatedAt = ref(null)
const loading = ref(false)
const error = ref('')

const stats = computed(() => (rows.value ? computeStats(rows.value) : null))

const ERRORS = {
  unauthorized: 'Password non valida.',
  not_configured: 'Password non ancora impostata: esegui generaPasswordAdmin() in Apps Script.',
  network: 'Connessione non riuscita. Riprova tra poco.'
}

// La password resta solo per la sessione del browser (si cancella chiudendo la scheda).
function readStored() {
  try { return sessionStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}
function store(value) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, value)
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* storage non disponibile */ }
}

async function load(pw = password.value) {
  if (!pw || loading.value) return
  loading.value = true
  error.value = ''
  try {
    const result = await fetchAdminRows(pw)
    rows.value = result.rows
    updatedAt.value = result.updatedAt
    password.value = pw
    store(pw)
  } catch (e) {
    error.value = ERRORS[e.code] || `Errore: ${e.code}`
    if (e.code === 'unauthorized') {
      rows.value = null
      store('')
    }
  } finally {
    loading.value = false
  }
}

function logout() {
  store('')
  password.value = ''
  rows.value = null
}

function exportCsv() {
  const day = new Date().toISOString().slice(0, 10)
  downloadCsv(rows.value, `rsvp-simone-manuela-${day}.csv`)
}

onMounted(() => {
  const saved = readStored()
  if (saved) load(saved)
})
</script>

<template>
  <main class="admin">
    <!-- Accesso -->
    <section v-if="!rows" class="login">
      <img class="login-logo" :src="wedding.logo" alt="" width="72" height="72">
      <h1>Area sposi</h1>
      <p class="muted">Inserisci la password per vedere le risposte RSVP.</p>
      <form @submit.prevent="load()">
        <label class="sr-only" for="admin-password">Password</label>
        <input
          id="admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Password"
          required
        >
        <button type="submit" class="primary" :disabled="loading">
          {{ loading ? 'Caricamento…' : 'Entra' }}
        </button>
      </form>
      <p class="error" role="alert">{{ error }}</p>
    </section>

    <!-- Dashboard -->
    <template v-else>
      <header class="head">
        <div>
          <h1>Risposte RSVP</h1>
          <p class="muted">
            {{ wedding.names }} · {{ wedding.dateLong }}
            <span class="sep">·</span> aggiornato {{ formatDate(updatedAt) }}
          </p>
        </div>
        <div class="actions">
          <button type="button" :disabled="loading" @click="load()">{{ loading ? 'Aggiorno…' : 'Aggiorna' }}</button>
          <button type="button" :disabled="!rows.length" @click="exportCsv">Scarica CSV</button>
          <button type="button" class="ghost" @click="logout">Esci</button>
        </div>
      </header>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <section class="kpis" aria-label="Numeri principali">
        <article class="kpi hero">
          <span class="kpi-label">Persone presenti</span>
          <strong class="kpi-value">{{ stats.present }}</strong>
          <span class="kpi-sub">su {{ stats.people }} persone indicate</span>
        </article>
        <article class="kpi">
          <span class="kpi-label">Risposte ricevute</span>
          <strong class="kpi-value">{{ stats.responses }}</strong>
          <span class="kpi-sub">ultima: {{ formatDate(stats.lastResponse) }}</span>
        </article>
        <article class="kpi">
          <span class="kpi-label">Accompagnatori</span>
          <strong class="kpi-value">{{ stats.companions }}</strong>
          <span class="kpi-sub">aggiunti dagli invitati</span>
        </article>
        <article class="kpi">
          <span class="kpi-label">Non ci saranno</span>
          <strong class="kpi-value">{{ stats.absent }}</strong>
          <span class="kpi-sub">persone</span>
        </article>
      </section>

      <div class="grid">
        <section class="card">
          <h2>Partecipazione</h2>
          <AttendanceBar :present="stats.present" :absent="stats.absent" />
        </section>

        <section class="card">
          <h2>Esigenze alimentari</h2>
          <p class="card-note">Conteggio sulle {{ stats.present }} persone presenti.</p>
          <DietChart :items="stats.diets" :base="stats.present" />
          <template v-if="stats.otherDiets.length">
            <h3>Dettaglio “Altro”</h3>
            <ul class="detail-list">
              <li v-for="p in stats.otherDiets" :key="p.id + p.nome + p.cognome">
                <strong>{{ p.nome }} {{ p.cognome }}</strong> — {{ p.altro }}
              </li>
            </ul>
          </template>
        </section>

        <section v-if="stats.notes.length" class="card wide">
          <h2>Note degli invitati <span class="count">{{ stats.notes.length }}</span></h2>
          <ul class="detail-list notes">
            <li v-for="p in stats.notes" :key="p.id + p.nome + p.cognome">
              <strong>{{ p.nome }} {{ p.cognome }}</strong>
              <p>{{ p.note }}</p>
            </li>
          </ul>
        </section>

        <section class="card wide">
          <h2>Tutte le risposte</h2>
          <ResponsesTable :rows="rows" />
        </section>
      </div>
    </template>
  </main>
</template>

<style scoped>
.admin {
  --admin-bg: #f4f3ee;
  --admin-surface: #fcfcfb;
  --admin-surface-2: #f6f5f0;
  --admin-ink: #23291c;
  --admin-ink-2: #4a5140;
  --admin-muted: #707764;
  --admin-line: #e3e1d7;
  --admin-present: #5d7a35;
  --admin-absent: #c48a2c;

  min-height: 100vh;
  padding: 40px clamp(16px, 4vw, 48px) 64px;
  background: var(--admin-bg);
  font-family: Manrope, system-ui, sans-serif;
  color: var(--admin-ink);
}

h1,
h2,
h3 {
  font-family: Manrope, system-ui, sans-serif;
  letter-spacing: -.01em;
}

.muted {
  color: var(--admin-muted);
}

.error {
  min-height: 1.4em;
  margin: 12px 0 0;
  color: #a63228;
  font-size: .9rem;
}

button {
  padding: 9px 16px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  background: var(--admin-surface);
  font: 600 .85rem Manrope, sans-serif;
  color: var(--admin-ink);
  cursor: pointer;
  transition: background .15s, border-color .15s;
}

button:hover:not(:disabled) {
  border-color: var(--admin-ink-2);
}

button:disabled {
  opacity: .55;
  cursor: default;
}

button.primary {
  background: var(--admin-ink);
  border-color: var(--admin-ink);
  color: #fff;
}

button.ghost {
  background: transparent;
}

/* --- login --- */
.login {
  max-width: 360px;
  margin: 12vh auto 0;
  padding: 40px 32px;
  border: 1px solid var(--admin-line);
  border-radius: 18px;
  background: var(--admin-surface);
  text-align: center;
}

.login-logo {
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--admin-line);
}

.login h1 {
  margin: 18px 0 6px;
  font-size: 1.5rem;
}

.login form {
  display: grid;
  gap: 10px;
  margin-top: 22px;
}

.login input {
  padding: 12px 14px;
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  font: inherit;
  text-align: center;
}

.login input:focus {
  outline: 2px solid var(--admin-present);
  outline-offset: 1px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

/* --- dashboard --- */
.head {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto 28px;
}

.head h1 {
  margin: 0;
  font-size: 1.9rem;
}

.head p {
  margin: 6px 0 0;
  font-size: .9rem;
}

.sep {
  margin: 0 4px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  max-width: 1200px;
  margin: 0 auto 14px;
}

.kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px 22px;
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  background: var(--admin-surface);
}

.kpi-label {
  font-size: .78rem;
  font-weight: 600;
  color: var(--admin-muted);
}

.kpi-value {
  font-size: 2.4rem;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.kpi.hero .kpi-value {
  font-size: 3.2rem;
}

.kpi-sub {
  font-size: .8rem;
  color: var(--admin-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 1200px;
  margin: 0 auto;
}

.card {
  padding: 22px 24px;
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  background: var(--admin-surface);
}

.card.wide {
  grid-column: 1 / -1;
}

.card h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 1rem;
}

.card h3 {
  margin: 22px 0 8px;
  font-size: .85rem;
  color: var(--admin-ink-2);
}

.card-note {
  margin: -8px 0 14px;
  font-size: .8rem;
  color: var(--admin-muted);
}

.count {
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--admin-surface-2);
  border: 1px solid var(--admin-line);
  font-size: .75rem;
  color: var(--admin-muted);
}

.detail-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: .88rem;
}

.notes {
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
}

.notes li {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--admin-surface-2);
}

.notes p {
  margin: 4px 0 0;
  color: var(--admin-ink-2);
  white-space: pre-line;
}

@media (max-width: 800px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .head h1 {
    font-size: 1.5rem;
  }
}
</style>
