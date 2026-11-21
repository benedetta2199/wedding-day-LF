<script setup>
import { computed } from 'vue'

// Dati di una persona. L'oggetto è reattivo e appartiene a RsvpForm: qui lo modifichiamo direttamente.
const props = defineProps({
  person: { type: Object, required: true },
  title: { type: String, required: true },
  isMain: { type: Boolean, default: false }
})
defineEmits(['remove'])

const DIETS = [
  ['celiaco', 'Celiaco'],
  ['vegetariano', 'Vegetariano'],
  ['vegano', 'Vegano'],
  ['altroAttivo', 'Altro']
]

const uid = computed(() => props.person.key)
// Gli invitati aggiunti sono sempre presenti; il principale sceglie.
const attending = computed(() => !props.isMain || props.person.presenza === true)
</script>

<template>
  <fieldset class="person">
    <legend>{{ title }}</legend>

    <div v-if="isMain" class="attendance" role="radiogroup" aria-label="La tua risposta">
      <div class="choice">
        <input :id="`${uid}-si`" v-model="person.presenza" type="radio" :value="true" :name="`${uid}-presenza`" required>
        <label :for="`${uid}-si`">Ci sono</label>
      </div>
      <div class="choice">
        <input :id="`${uid}-no`" v-model="person.presenza" type="radio" :value="false" :name="`${uid}-presenza`" required>
        <label :for="`${uid}-no`">Non ci sono</label>
      </div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label :for="`${uid}-nome`">Nome</label>
        <input
          :id="`${uid}-nome`"
          v-model="person.nome"
          required
          maxlength="100"
          :autocomplete="isMain ? 'given-name' : 'off'"
        >
      </div>
      <div class="field">
        <label :for="`${uid}-cognome`">Cognome</label>
        <input
          :id="`${uid}-cognome`"
          v-model="person.cognome"
          required
          maxlength="100"
          :autocomplete="isMain ? 'family-name' : 'off'"
        >
      </div>

      <div v-if="attending" class="field full">
        <span class="field-title">Esigenze alimentari</span>
        <div class="diet-chips">
          <label v-for="[field, label] in DIETS" :key="field" class="diet-chip">
            <input v-model="person[field]" type="checkbox">
            <span>{{ label }}</span>
          </label>
        </div>
      </div>
      <div v-if="attending && person.altroAttivo" class="field full">
        <label :for="`${uid}-altro`">Specifica “Altro”</label>
        <input
          :id="`${uid}-altro`"
          v-model="person.altro"
          required
          maxlength="500"
          placeholder="Es. allergia alla frutta secca"
        >
      </div>

      <div class="field full">
        <label :for="`${uid}-note`">Note</label>
        <textarea :id="`${uid}-note`" v-model="person.note" maxlength="2000" rows="3"></textarea>
      </div>
    </div>

    <button v-if="!isMain" type="button" class="person-remove" @click="$emit('remove')">
      Rimuovi invitato
    </button>
  </fieldset>
</template>

<style scoped>
.person {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.person + .person {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid var(--line);
}

legend {
  padding: 0 0 14px;
  font-family: var(--font-title);
  font-size: 1.375rem;
  color: var(--oliva);
}

.attendance {
  margin-bottom: 22px;
}

.diet-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.diet-chip {
  position: relative;
  cursor: pointer;
}

.diet-chip input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.diet-chip span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: #fff;
  font-size: .9375rem;
  font-weight: 500;
  transition: background-color .2s, border-color .2s, color .2s;
}

.diet-chip:hover span {
  border-color: var(--oliva);
}

.diet-chip input:checked + span {
  border-color: var(--oliva);
  background: var(--oliva);
  color: var(--carta);
}

.diet-chip input:checked + span::before {
  content: "✓";
}

.diet-chip input:focus-visible + span {
  outline: 2px solid var(--fede-ink);
  outline-offset: 3px;
}

.person-remove {
  min-height: 44px;
  margin-top: 8px;
  padding: 0;
  border: 0;
  background: none;
  font-size: .9375rem;
  color: var(--oliva-soft);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.person-remove:hover {
  color: var(--oliva);
}
</style>
