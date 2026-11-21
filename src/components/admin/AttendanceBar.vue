<script setup>
import { computed } from 'vue'

// Barra segmentata presenti/assenti: legenda + etichette dirette, mai solo colore.
const props = defineProps({
  present: { type: Number, required: true },
  absent: { type: Number, required: true }
})

const total = computed(() => props.present + props.absent)
const pct = n => (total.value ? Math.round((n / total.value) * 100) : 0)
const segments = computed(() => [
  { key: 'present', label: 'Presenti', value: props.present, pct: pct(props.present) },
  { key: 'absent', label: 'Assenti', value: props.absent, pct: pct(props.absent) }
])
</script>

<template>
  <div class="attendance-bar">
    <ul class="legend">
      <li v-for="s in segments" :key="s.key">
        <span class="swatch" :class="s.key" aria-hidden="true"></span>
        {{ s.label }} <strong>{{ s.value }}</strong> <span class="muted">({{ s.pct }}%)</span>
      </li>
    </ul>
    <div
      v-if="total"
      class="bar"
      role="img"
      :aria-label="`Presenti ${present} (${pct(present)}%), assenti ${absent} (${pct(absent)}%)`"
    >
      <span
        v-for="s in segments.filter(x => x.value > 0)"
        :key="s.key"
        class="segment"
        :class="s.key"
        :style="{ flexGrow: s.value }"
        :title="`${s.label}: ${s.value} (${s.pct}%)`"
      ></span>
    </div>
    <p v-else class="muted">Ancora nessuna risposta.</p>
  </div>
</template>

<style scoped>
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
  font-size: .9rem;
  color: var(--admin-ink);
}

.legend li {
  display: flex;
  align-items: center;
  gap: 7px;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.bar {
  display: flex;
  gap: 2px;
  height: 18px;
}

.segment {
  min-width: 4px;
  border-radius: 4px;
  transition: filter .15s;
}

.segment:hover {
  filter: brightness(1.08);
}

.present {
  background: var(--admin-present);
}

.absent {
  background: var(--admin-absent);
}

.muted {
  color: var(--admin-muted);
}
</style>
