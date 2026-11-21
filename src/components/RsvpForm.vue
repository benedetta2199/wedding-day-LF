<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PersonFields from './PersonFields.vue'
import { RSVP_ENDPOINT } from '@/config/wedding'

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
.add-guest {
  display: block;
  width: 100%;
  margin-top: 30px;
  padding: 15px;
  border: 1px dashed rgba(122, 112, 64, .6);
  border-radius: 999px;
  background: transparent;
  font: 600 .66rem Manrope, sans-serif;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--gold);
  cursor: pointer;
  transition: background .2s, border-color .2s;
}

.add-guest:hover {
  background: rgba(230, 232, 216, .55);
  border-color: var(--gold);
}

.trap {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.submit {
  margin-top: 34px;
  width: min(100%, 390px);
  min-height: 62px;
}

.submit:disabled {
  opacity: .6;
  cursor: progress;
}

.form-error {
  min-height: 1.5em;
  margin: 14px 0 0;
  color: #a63228;
  font-size: 1rem;
}
</style>
