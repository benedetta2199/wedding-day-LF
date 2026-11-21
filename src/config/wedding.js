// Tutti i contenuti modificabili del sito in un unico punto.
// Immagini in src/assets/img (temp.webp è il segnaposto per le foto mancanti).
import fotoSposi from '@/assets/img/foto-sposi.png'
import santuario from '@/assets/img/santuario-longiano.png'
import agriturismo from '@/assets/img/agriturismo.png'
import uliveto from '@/assets/img/cerimonia-interno.jpg'
import logo from '@/assets/img/logo-sm.png'
import logoHero from '@/assets/img/logo-lg.png'

export const RSVP_ENDPOINT =
  import.meta.env.VITE_RSVP_ENDPOINT ||
  'https://script.google.com/macros/s/AKfycbyIsdBtkWArxKPA9yGmamJHFsmnuBs_Se6y00jqAMJb_zvwdCPFfkL7DJ84CMFr5Ag6/exec'

export const wedding = {
  couple: ['Lucia', 'Filippo'],
  names: 'Lucia & Filippo',
  dateShort: '24 · 04 · 2027',
  dateLong: '24 aprile 2027',
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
      time: '12:00',
      stripName: 'Chiesa di San Giuseppe · Longiano',
      title: ['Chiesa di', 'San Giuseppe'],
      text: 'In un luogo raccolto e luminoso ci scambieremo le nostre promesse, circondati dalle persone che hanno accompagnato la nostra storia.',
      facts: [
        ['Quando', '24 aprile 2027 · ore 12:00'],
        ['Dove', 'Piazza Malatestiana · Longiano'],
        ['Ritrovo', 'Dalle ore 11:40'],
        ['Durata', 'Circa un’ora']
      ],
      map: 'https://www.google.com/maps/search/?api=1&query=Chiesa+di+San+Giuseppe+Longiano',
      reverse: false,
      gallery: [
        { src: santuario, alt: 'La facciata della chiesa di Longiano al tramonto' }
      ],
      // Parcheggi vicino alla chiesa (pagina /programma). DA VERIFICARE: nomi, note e link sono indicativi.
      parking: [
        {
          name: 'Parcheggio del centro storico',
          note: 'A pochi passi dalla chiesa · posti limitati, consigliamo di arrivare presto',
          map: 'https://www.google.com/maps/search/?api=1&query=parcheggio+centro+storico+Longiano'
        },
        {
          name: 'Parcheggio Teatro Petrella',
          note: 'Circa 5 minuti a piedi dalla chiesa',
          map: 'https://www.google.com/maps/search/?api=1&query=parcheggio+Teatro+Petrella+Longiano'
        },
        {
          name: 'Parcheggio Castello Malatestiano',
          note: 'Circa 5 minuti a piedi · ampio e gratuito',
          map: 'https://www.google.com/maps/search/?api=1&query=parcheggio+Castello+Malatestiano+Longiano'
        }
      ]
    },
    {
      id: 'ricevimento',
      label: 'Ricevimento',
      time: '14:00',
      stripName: 'L’Antico Casale · Longiano',
      title: ['L’Antico', 'Casale'],
      text: 'Tra il verde della campagna romagnola ci aspettano un brindisi, una cena da assaporare e una festa da ricordare senza guardare l’orologio.',
      facts: [
        ['Quando', 'Dalle ore 14:00'],
        ['Dove', 'Località 4 Colli · Longiano'],
        ['Aperitivo', 'In giardino all’arrivo degli ospiti'],
        ['Servizi', 'Parcheggio interno']
      ],
      map: 'https://www.google.com/maps/search/?api=1&query=Ristorante+4+Colli+Longiano',
      reverse: true,
      gallery: [
        { src: agriturismo, alt: 'Il viale d’ingresso del casale tra le colline al tramonto' }
      ],
      parking: [
        {
          name: 'Parcheggio interno',
          note: 'Gratuito e riservato agli ospiti, all’interno della struttura',
          map: 'https://www.google.com/maps/search/?api=1&query=Ristorante+4+Colli+Longiano'
        }
      ]
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
        time: '12:00',
        icon: 'church',
        title: 'Cerimonia religiosa',
        placeId: 'cerimonia',
        place: 'Chiesa di San Giuseppe',
        address: 'Piazza Malatestiana · Longiano (FC)',
        note: 'Ritrovo dalle ore 11:40',
      },
      {
        id: 'ricevimento',
        time: '14:00',
        icon: 'wine',
        title: 'Ricevimento',
        placeId: 'ricevimento',
        place: 'L’Antico Casale',
        address: 'Località 4 Colli · Longiano (FC)',
        note: 'Parcheggio interno',
      }
    ],
    // Informazioni pratiche della pagina estesa. Sostituire i testi "Dettagli in arrivo".
    practical: [
      { icon: 'car', title: 'Come arrivare', text: 'La chiesa e il ricevimento sono entrambi a Longiano: tra i due luoghi ci vogliono pochi minuti in auto.' },
      { icon: 'parking', title: 'Parcheggio', text: 'Il ricevimento dispone di un parcheggio interno. Per la cerimonia trovate i parcheggi consigliati qui sopra.' },
      { icon: 'shirt', title: 'Dress code', text: 'Dettagli in arrivo.' },
      { icon: 'bed', title: 'Dove dormire', text: 'Dettagli in arrivo.' },
      { icon: 'baby', title: 'Bambini', text: 'Dettagli in arrivo.' },
      { icon: 'phone', title: 'Contatti', text: 'Dettagli in arrivo.' }
    ]
  },

  gift: {
    holder: 'Lucia Comandini',
    iban: 'IT98A0306924020100000003728'
  }
}
