<script setup>
import { computed } from 'vue'

// Barre orizzontali, una sola serie: nessuna legenda, valore scritto accanto a ogni barra.
const props = defineProps({
  items: { type: Array, required: true }, // [{ key, label, count }]
  base: { type: Number, required: true } // persone presenti
})

const max = computed(() => Math.max(1, ...props.items.map(i => i.count)))
</script>

<template>
  <ul class="diet-chart">
    <li v-for="item in items" :key="item.key" :title="`${item.label}: ${item.count} su ${base} presenti`">
      <span class="label">{{ item.label }}</span>
      <span class="track">
        <span v-if="item.count" class="fill" :style="{ width: `${(item.count / max) * 100}%` }"></span>
      </span>
      <span class="value">{{ item.count }}</span>
    </li>
  </ul>
</template>

<style scoped>
.diet-chart {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: grid;
  grid-template-columns: 96px 1fr 32px;
  align-items: center;
  gap: 12px;
  font-size: .9rem;
}

.label {
  color: var(--admin-ink-2);
}

.track {
  height: 12px;
}

.fill {
  display: block;
  height: 100%;
  border-radius: 0 4px 4px 0;
  background: var(--admin-present);
}

.value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  text-align: right;
  color: var(--admin-ink);
}
</style>
