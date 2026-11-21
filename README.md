# Simone & Manuela — Wedding Website

Sito del matrimonio realizzato con **Vue 3** (Composition API, `<script setup>`), **Vue Router** e **Vite**.

## Avvio in locale

```bash
npm install
npm run dev       # sviluppo su http://localhost:5173
npm run build     # build di produzione in dist/
npm run preview   # anteprima della build
```

Serve Node.js 20.19+ o 22.12+.

## Struttura

```
src/
  config/wedding.js     ← TUTTI i contenuti: nomi, date, luoghi, foto, IBAN, endpoint RSVP
  router/index.js       ← pagine (/, /rsvp, /grazie, 404) e titoli
  views/                ← una vista per pagina
  components/           ← header, footer, sezioni della home, form RSVP
  directives/reveal.js  ← animazione di comparsa allo scroll (v-reveal)
  composables/          ← logica riutilizzabile (copia negli appunti)
  styles/main.css       ← stile globale
  assets/img/           ← immagini (Vite le ottimizza con nomi hash per la cache)
google/apps-script.gs   ← codice da incollare in Google Apps Script (non viene pubblicato)
```

Per cambiare testi, orari o foto modifica quasi sempre solo `src/config/wedding.js`.

## RSVP → Google Sheets

L'URL della Web App di Apps Script si legge dalla variabile d'ambiente `VITE_RSVP_ENDPOINT`
(vedi `.env.example`). Se manca, il sito usa l'URL predefinito scritto in `src/config/wedding.js`.

## Deploy su Vercel

1. Carica questa cartella in un repository GitHub (con `package.json` nella root).
2. Su Vercel: *Add New → Project* → importa il repository. Il preset **Vite** viene riconosciuto da solo.
3. (Facoltativo) In *Settings → Environment Variables* aggiungi `VITE_RSVP_ENDPOINT`.
4. *Deploy*. Ogni push genera un nuovo deploy.

`vercel.json` reindirizza tutte le rotte su `index.html` (così `/rsvp` e `/grazie` funzionano
anche se aperte direttamente) e mette in cache per un anno i file in `/assets/`.
