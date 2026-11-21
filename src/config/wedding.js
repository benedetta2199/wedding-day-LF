// Tutti i contenuti modificabili del sito in un unico punto.
import cerimoniaFacciata from '@/assets/img/cerimonia-facciata.webp'
import cerimoniaInterno from '@/assets/img/cerimonia-interno.jpg'
import ricevimentoAerea from '@/assets/img/ricevimento-aerea.jpeg'
import ricevimentoFioritura from '@/assets/img/ricevimento-fioritura.jpeg'
import ricevimentoPrato from '@/assets/img/ricevimento-prato.jpeg'
import ricevimentoPortico from '@/assets/img/ricevimento-portico.jpeg'
import storia from '@/assets/img/la-nostra-storia.jpeg'
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
    logoHero,
    logoAlt: 'Lucia e Filippo',
    image: cerimoniaInterno,
    imageAlt: 'Interno della Chiesa di San Giuseppe',
  },

  story: {
    image: storia,
    imageAlt: 'Le mani di Lucia e Filippo nel momento della proposta',
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
        ['Ritrovo', 'Dalle ore 11:40']
      ],
      map: 'https://www.google.com/maps/search/?api=1&query=Chiesa+di+San+Giuseppe+Longiano',
      reverse: false,
      gallery: [
        { src: cerimoniaFacciata, alt: 'Facciata della Chiesa di San Giuseppe', cls: 'large' },
        { src: cerimoniaInterno, alt: 'Interno della chiesa' }
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
        ['Servizi', 'Parcheggio interno']
      ],
      map: 'https://www.google.com/maps/search/?api=1&query=Ristorante+4+Colli+Longiano',
      reverse: true,
      gallery: [
        { src: ricevimentoAerea, alt: 'Vista aerea dell’Antico Casale', cls: 'large' },
        { src: ricevimentoFioritura, alt: 'Il ristorante 4 Colli tra le colline' },
        { src: ricevimentoPrato, alt: 'Il prato e il giardino dell’Antico Casale' },
        { src: ricevimentoPortico, alt: 'Il portico e il giardino dell’Antico Casale', cls: 'wide' }
      ]
    }
  ],

  // Programma della giornata: versione breve in home, versione estesa nella pagina /programma.
  // `placeId` collega l'evento a un luogo di `places` (foto e mappa vengono presi da lì).
  program: {
    day: 'Domenica',
    events: [
      {
        id: 'cerimonia',
        time: '12:00',
        icon: '⛪',
        title: 'Cerimonia religiosa',
        placeId: 'cerimonia',
        place: 'Chiesa di San Giuseppe',
        address: 'Piazza Malatestiana · Longiano (FC)',
        note: 'Ritrovo dalle ore 11:40',
        // Testo e punti mostrati solo nella pagina estesa.
        details: 'In un luogo raccolto e luminoso ci scambieremo le nostre promesse, circondati dalle persone che hanno accompagnato la nostra storia.',
        info: [
          ['Ritrovo', 'Dalle ore 11:40 davanti alla chiesa'],
          ['Durata', 'Circa un’ora']
        ]
      },
      {
        id: 'ricevimento',
        time: '14:00',
        icon: '🥂',
        title: 'Ricevimento',
        placeId: 'ricevimento',
        place: 'L’Antico Casale',
        address: 'Località 4 Colli · Longiano (FC)',
        note: 'Parcheggio interno',
        details: 'Tra il verde della campagna romagnola ci aspettano un brindisi, una cena da assaporare e una festa da ricordare senza guardare l’orologio.',
        info: [
          ['Aperitivo', 'In giardino all’arrivo degli ospiti'],
          ['Parcheggio', 'Interno alla struttura']
        ]
      },
      {
        id: 'festa',
        time: 'Sera',
        icon: '🎂',
        title: 'Torta, musica e DJ',
        note: 'La festa continua fino a tarda notte!',
        details: 'Dopo il taglio della torta si balla: la festa continua fino a tarda notte.',
        info: []
      }
    ],
    // Informazioni pratiche della pagina estesa. Sostituire i testi "Dettagli in arrivo".
    practical: [
      { icon: '🚗', title: 'Come arrivare', text: 'La chiesa e il ricevimento sono entrambi a Longiano: tra i due luoghi ci vogliono pochi minuti in auto.' },
      { icon: '🅿️', title: 'Parcheggio', text: 'Il ricevimento dispone di un parcheggio interno. Per la cerimonia: dettagli in arrivo.' },
      { icon: '👗', title: 'Dress code', text: 'Dettagli in arrivo.' },
      { icon: '🏨', title: 'Dove dormire', text: 'Dettagli in arrivo.' },
      { icon: '🧒', title: 'Bambini', text: 'Dettagli in arrivo.' },
      { icon: '📞', title: 'Contatti', text: 'Dettagli in arrivo.' }
    ]
  },

  gift: {
    holder: 'Lucia Comandini',
    iban: 'IT98A0306924020100000003728'
  }
}
