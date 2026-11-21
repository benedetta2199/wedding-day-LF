// Tutti i contenuti modificabili del sito in un unico punto.
// Immagini in src/assets/img (temp.webp è il segnaposto per le foto mancanti).
import fotoSposi from '@/assets/img/foto-sposi.png'
import santuario from '@/assets/img/santuario-longiano.png'
import agriturismo from '@/assets/img/agriturismo.png'
import uliveto from '@/assets/img/cerimonia-interno.jpg'
import logo from '@/assets/img/logo-sm.png'
import logoHero from '@/assets/img/logo-lg.png'

// Dati privati (URL dell'Apps Script, link Drive, IBAN): stanno nelle variabili d'ambiente,
// non nel codice. In locale: .env.local (vedi .env.example); in produzione: Settings → Environment Variables su Vercel.
const env = import.meta.env

// URL della Web App: deve finire con /exec (senza, Google risponde 401 e il browser segnala un errore CORS).
const endpoint = env.VITE_RSVP_ENDPOINT || ''
export const RSVP_ENDPOINT = endpoint ? endpoint.replace(/\/(exec)?\/?$/, '') + '/exec' : ''
if (!RSVP_ENDPOINT) {
  console.error('VITE_RSVP_ENDPOINT non impostata: RSVP, foto e pensieri non funzioneranno. Aggiungila su Vercel e rifai il deploy.')
}

export const wedding = {
  couple: ['Lucia', 'Filippo'],
  names: 'Lucia & Filippo',
  dateShort: '24 · 04 · 2027',
  dateLong: '24 aprile 2027',
  rsvpDeadline: 'mercoledì 24 marzo 2027', // il 24 marzo 2027 è mercoledì
  city: 'Longiano',
  logo,
  logoAlt: 'Logo Lucia e Filippo',

  hero: {
    invite: 'Siamo felici di invitarvi al nostro matrimonio',
    logoHero,
    logoAlt: 'Lucia e Filippo',
    // Foto degli sposi nell'arco della home
    photo: fotoSposi,
    photoAlt: 'Lucia e Filippo abbracciati in giardino al tramonto',
    // Fascia dietro la sezione regalo
    image: uliveto,
    imageAlt: 'Uliveto sulle colline al tramonto',
  },

  story: {
    image: fotoSposi,
    imageAlt: 'Lucia e Filippo abbracciati in giardino al tramonto',
    eyebrow: 'Il nostro sì',
    latin: 'Ubi tu, ibi ego',
    quote: '“Il più bello dei nostri inizi.”',
    text: 'Abbiamo condiviso viaggi, progetti e giorni semplici diventati ricordi preziosi. Il 20 settembre vogliamo fermare il tempo per un istante e vivere con voi l’inizio del nostro prossimo capitolo.'
  },

  places: [
    {
      id: 'cerimonia',
      label: 'Cerimonia',
      time: '11:00',
      stripName: 'Santuario del SS. Crocifisso · Longiano',
      title: ['Santuario del', 'SS. Crocifisso'],
      text: '',
      facts: [
        ['Quando', '24 aprile 2027 · ore 11:00'],
        ['Dove', 'Via Decio Raggi 2, 47020 Longiano (FC)'],
        ['Ritrovo', 'Dalle ore 10:45'],
        ['Durata', 'Circa un’ora']
      ],
      map: 'https://maps.app.goo.gl/X3K7FC6kb2vHWnWJ7',
      reverse: false,
      gallery: [
        { src: santuario, alt: 'Il Santuario del SS. Crocifisso di Longiano al tramonto' }
      ],
      // Parcheggi vicino al santuario (pagina /programma).
      parking: [
        {
          name: 'Parcheggio del Santuario',
          note: 'Dietro la chiesa, accesso da via Decio Raggi',
          map: 'https://maps.app.goo.gl/zzT32QxzvhbVh4qf8'
        },
        {
          name: 'Parcheggio XI Ottobre ',
          note: 'A pochi passi dalla chiesa · posti limitati, consigliamo di arrivare presto',
          map: 'https://maps.app.goo.gl/jNVhYGiQMADTR73J8'
        },
        {
          name: 'Parcheggio Teatro Petrella',
          note: 'Circa 5 minuti a piedi dalla chiesa',
          map: 'https://maps.app.goo.gl/4BzfFtZMqdDiWDdc6'
        }
      ]
    },
    {
      id: 'ricevimento',
      label: 'Ricevimento',
      time: '13:00',
      stripName: 'Agriturismo 4 Colli · Sorrivoli',
      title: ['Agriturismo', '4 Colli'],
      text: '',
      facts: [
        ['Quando', 'Dalle ore 13:00'],
        ['Dove', 'Via Provinciale Monteleone 6851, 47020 Sorrivoli (FC)'],
        ['Aperitivo', 'In giardino all’arrivo degli ospiti'],
        ['Servizi', 'Parcheggio interno']
      ],
      map: 'https://maps.app.goo.gl/ByXE6r4MnURM1kR96',
      reverse: true,
      gallery: [
        { src: agriturismo, alt: 'Il viale d’ingresso dell’Agriturismo 4 Colli al tramonto' }
      ],
      // Al posto dei parcheggi, nella pagina /programma
      directions: {
        title: 'Come arrivare',
        text: 'L’agriturismo è a Sorrivoli a circa 15 minuti in auto dalla chiesa.'
      }
    }
  ],

  // Programma della giornata (pagina /programma).
  // La timeline mostra solo l'essenziale; i dettagli stanno nella sezione del luogo (`placeId`).
  // La foto è la prima di `gallery` del luogo; `photo` la sostituisce.
  program: {
    day: 'Sabato', // il 24 aprile 2027 è sabato
    events: [
      {
        id: 'cerimonia',
        time: '11:00',
        icon: 'church',
        title: 'Cerimonia religiosa',
        placeId: 'cerimonia',
        place: 'Santuario del SS. Crocifisso',
        address: 'Via Decio Raggi 2 · Longiano (FC)',
        note: 'Ritrovo dalle ore 10:45',
      },
      {
        id: 'ricevimento',
        time: '13:00',
        icon: 'wine',
        title: 'Ricevimento',
        placeId: 'ricevimento',
        place: 'Agriturismo 4 Colli',
        address: 'Via Provinciale Monteleone 6851 · Sorrivoli (FC)',
        note: 'A 15 minuti in auto dal santuario',
      }
    ],
    // Informazioni pratiche della pagina estesa. Sostituire i testi "Dettagli in arrivo".
    practical: [
      { icon: 'car', title: 'Come arrivare', text: 'Il santuario è a Longiano e l’agriturismo a Sorrivoli: tra i due luoghi ci vogliono circa 15 minuti in auto.' },
      { icon: 'parking', title: 'Parcheggio', text: 'Il ricevimento dispone di un parcheggio interno. Per la cerimonia trovate i parcheggi consigliati qui sopra.' },
      { icon: 'shirt', title: 'Dress code', text: 'Dettagli in arrivo.' },
      { icon: 'bed', title: 'Dove dormire', text: 'Dettagli in arrivo.' },
      { icon: 'baby', title: 'Bambini', text: 'Dettagli in arrivo.' },
      { icon: 'phone', title: 'Contatti', text: 'Dettagli in arrivo.' }
    ]
  },

  // Pagina /foto. Gli ospiti caricano le foto direttamente dal sito (finiscono nella cartella Drive).
  // `uploadUrl` (facoltativo): link alternativo per i file troppo grandi, es. video lunghi.
  // La galleria legge la cartella impostata in PHOTOS_FOLDER_ID nell'Apps Script.
  photos: {
    maxUploadMb: 30, // come MAX_MB_UPLOAD nell'Apps Script; i file più grandi vanno caricati dal link Drive
    maxMessageLength: 600, // come MAX_CARATTERI_PENSIERO nell'Apps Script
    maxCaptionLength: 120, // dedica della polaroid, come MAX_CARATTERI_DEDICA nell'Apps Script
    // Spunti del pulsante "Suggerimento": la domanda e l'inizio di frase che si può inserire.
    prompts: [
      { domanda: 'Qual è il ricordo più bello che avete con gli sposi?', inizio: 'Ricordo ancora quando ' },
      { domanda: 'Cosa augurate loro per la vita insieme?', inizio: 'Vi auguro ' },
      { domanda: 'Come vi siete conosciuti, voi e gli sposi?', inizio: 'Ci siamo conosciuti ' },
      { domanda: 'Un consiglio per un matrimonio felice?', inizio: 'Il mio consiglio è ' },
      { domanda: 'Cosa vi piace di più di loro come coppia?', inizio: 'Di voi due amo ' },
      { domanda: 'Un momento di oggi che non dimenticherete?', inizio: 'Di questa giornata porterò con me ' },
      { domanda: 'Dove li immaginate tra dieci anni?', inizio: 'Tra dieci anni vi immagino ' },
      { domanda: 'Una canzone che vi fa pensare a loro?', inizio: 'Quando sento ' },
      { domanda: 'Una parola per descrivere gli sposi?', inizio: 'Se dovessi descrivervi con una parola direi ' },
      { domanda: 'Cosa vorreste dire loro oggi, semplicemente?', inizio: 'Grazie per ' }
    ],
    uploadUrl: env.VITE_PHOTOS_UPLOAD_URL || '',
    perPage: 25 // foto chieste al server per volta ("Carica altre"); compaiono a gruppi di perPage/5
  },

  gift: {
    holder: env.VITE_GIFT_HOLDER || '',
    iban: env.VITE_GIFT_IBAN || ''
  }
}
