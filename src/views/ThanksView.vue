<script setup>
import MessagePage from '@/components/MessagePage.vue'

// Lo stato arriva dal form RSVP tramite history.state (assente se la pagina è aperta direttamente).
const declined = history.state?.attending === false
const subtitle = declined
  ? 'Ci dispiace che non potrai essere con noi, ma grazie di cuore per averci risposto.'
  : "Abbiamo ricevuto la tua risposta e non vediamo l'ora di condividere questo giorno speciale con te."
</script>

<template>
  <MessagePage title="Grazie di cuore." :subtitle="subtitle" />
</template>
