<script setup>
import { wedding } from '@/config/wedding'
import { useClipboard } from '@/composables/useClipboard'

const { gift } = wedding
const { copied, copy } = useClipboard()
</script>

<template>
  <section id="regalo" class="gift">
  
    <div class="hero-image">
      <img :src="wedding.hero.image" :alt="wedding.hero.imageAlt" fetchpriority="high">
    </div>
    <div class="container">
      <div v-reveal class="gift-card">
        <span class="eyebrow">04 — Regalo</span>
        <h2>Un pensiero per noi.</h2>
        <div class="gift-divider" aria-hidden="true"><span>♡</span></div>
        <p class="gift-message">
          Il regalo più bello per noi sarà la vostra presenza. Per chi volesse comunque farci un pensiero,
          desideriamo precisare che viviamo già insieme e non abbiamo bisogno di regali materiali, avendo già
          una casa completa; una busta sarà quindi la soluzione più semplice e gradita.<strong>Grazie di cuore.</strong>
        </p>
        <div class="bank">
          <p class="gift-note">Per chi preferisse lasciarci un pensiero con un bonifico</p>
          <span class="bank-label">Intestatario</span>
          <div class="bank-holder">{{ gift.holder }}</div>
          <span class="bank-label">IBAN</span>
          <div class="iban">
            <code>{{ gift.iban }}</code>
            <button class="copy" type="button" @click="copy(gift.iban)">{{ copied ? 'Copiato' : 'Copia' }}</button>
          </div>
        </div>
      </div>
    </div>
    <div class="toast" :class="{ show: copied }" role="status">IBAN copiato</div>
  </section>
</template>
