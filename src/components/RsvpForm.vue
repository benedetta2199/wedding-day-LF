<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PersonFields from './PersonFields.vue'
import AppIcon from './AppIcon.vue'
import { RSVP_ENDPOINT, wedding } from '@/config/wedding'

const MAX_PEOPLE = 10 // principale + invitati aggiunti (deve coincidere con MAX_PERSONE nello script)

// crypto.randomUUID esiste solo in https/localhost: fallback per i test da telefono in rete locale.
const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`

const newPerson = () => ({
  key: uid(),
  nome: '',
  cognome: '',
  presenza: null, // usato solo dal principale; gli invitati aggiunti sono sempre presenti
  celiaco: false,
  vegetariano: false,
  vegano: false,
  altroAttivo: false,
  altro: '',
  note: ''
})

const router = useRouter()
const main = reactive(newPerson())
const guests = ref([])
const trap = ref('') // honeypot anti-bot
const status = ref('idle') // idle | sending | error
const errorMessage = ref('')
// Resta uguale se l'invio viene ripetuto: lo script ignora i doppioni con lo stesso ID.
const submissionId = uid()

// Con "Non ci sono" gli invitati aggiunti vengono nascosti e non inviati
// (restano in memoria se si torna su "Ci sono").
const attending = computed(() => main.presenza === true)
const people = computed(() => (attending.value ? [main, ...guests.value] : [main]))
const canAdd = computed(() => attending.value && people.value.length < MAX_PEOPLE)

function addGuest() {
  if (canAdd.value) guests.value.push(reactive(newPerson()))
}

function removeGuest(key) {
  guests.value = guests.value.filter(g => g.key !== key)
}

function toPayload(p, isMain) {
  const present = isMain ? p.presenza === true : true
  return {
    nome: p.nome.trim(),
    cognome: p.cognome.trim(),
    presenza: present,
    celiaco: present && p.celiaco,
    vegetariano: present && p.vegetariano,
    vegano: present && p.vegano,
    altro: present && p.altroAttivo ? p.altro.trim() : '',
    note: p.note.trim()
  }
}

function fail(message) {
  status.value = 'error'
  errorMessage.value = message
}

async function submit() {
  if (status.value === 'sending') return

  if (trap.value) {
    // I bot compilano il campo nascosto: finto successo, nessun invio.
    router.push({ name: 'grazie' })
    return
  }
  if (main.presenza === null) return fail('Indica se ci sarai.')

  status.value = 'sending'
  errorMessage.value = ''

  const payload = {
    id: submissionId,
    persone: people.value.map((p, i) => toPayload(p, i === 0))
  }

  try {
    // Content-Type text/plain = richiesta "semplice": niente preflight CORS, risposta leggibile.
    const response = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    })
    const result = await response.json()
    if (!result.ok) throw new Error(result.error || 'Risposta non valida')

    router.push({ name: 'grazie', state: { attending: main.presenza } })
  } catch (error) {
    console.error(error)
    fail('Non siamo riusciti a salvare la risposta. Controlla la connessione e premi di nuovo Invia: non verranno creati doppioni.')
  }
}
</script>

<template>
  <form class="rsvp-form" @submit.prevent="submit">
    <span class="eyebrow">RSVP</span>
    <h2>Sarete con noi?</h2>
    <p class="rsvp-deadline">
      <AppIcon name="calendar" :size="20" />
      <span>Vi chiediamo di confermare entro <strong>{{ wedding.rsvpDeadline }}</strong>.</span>
    </p>
    <p class="rsvp-intro">
      Una sola risposta per nucleo familiare: inserisci i tuoi dati e aggiungi le persone che verranno con te.
    </p>

    <PersonFields :person="main" title="I tuoi dati" is-main />

    <PersonFields
      v-for="(guest, i) in (attending ? guests : [])"
      :key="guest.key"
      :person="guest"
      :title="`Invitato ${i + 1}`"
      @remove="removeGuest(guest.key)"
    />

    <button v-if="canAdd" type="button" class="add-guest" @click="addGuest">
      + Aggiungi invitato
    </button>

    <!-- honeypot: invisibile alle persone -->
    <input
      v-model="trap"
      class="trap"
      type="text"
      name="website"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
    >

    <button class="btn primary submit" type="submit" :disabled="status === 'sending'">
      {{ status === 'sending' ? 'Invio…' : 'Invia la risposta' }}
    </button>

    <p class="form-error" role="alert" aria-live="polite">
      {{ status === 'error' ? errorMessage : '' }}
    </p>
  </form>
</template>

<style scoped>
/* Scadenza della conferma: ben visibile, subito sotto il titolo */
.rsvp-deadline {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  border: 1px solid rgba(107, 113, 72, .3);
  border-radius: 16px;
  background: var(--verde-chiaro);
  line-height: 1.45;
}

.rsvp-deadline svg {
  flex-shrink: 0;
  color: var(--erba);
}

.rsvp-deadline strong {
  font-weight: 600;
  color: var(--bosco);
}

.add-guest {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 52px;
  margin-top: 28px;
  border: 1px dashed var(--fede-ink);
  border-radius: 999px;
  background: transparent;
  font-size: 1rem;
  font-weight: 500;
  color: var(--fede-ink);
  transition: background-color .2s;
}

.add-guest:hover {
  background: rgba(194, 154, 98, .14);
}

.trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.submit {
  width: 100%;
  min-height: 56px;
  margin-top: 28px;
}

.submit:disabled {
  opacity: .6;
  cursor: progress;
}

.form-error {
  min-height: 1.5em;
  margin-top: 14px;
  color: #a63228;
}

@media (min-width: 600px) {
  .submit {
    width: auto;
    min-width: 280px;
  }
}
</style>
