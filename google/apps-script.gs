// ID del foglio: docs.google.com/spreadsheets/d/<ID>/edit
const SPREADSHEET_ID = '1xtXYBRDbnEI8y-YrDpV9cE39rhOXBlrKWyYLfO4e3J4';
const SHEET_NAME = 'Risposte RSVP';
const MAX_PERSONE = 10;

// Cartella Drive delle foto degli ospiti: drive.google.com/drive/folders/<ID>
// Le foto vengono lette anche dalle sottocartelle (es. quelle create da Google Moduli).
const PHOTOS_FOLDER_ID = '';
const MAX_FOTO = 2000;
const CACHE_FOTO_SECONDI = 120; // l'elenco viene riletto da Drive al massimo ogni 2 minuti
// Caricamento dal sito: dimensione massima di un file (Apps Script accetta richieste fino a ~50 MB,
// e il file viaggia in base64, che pesa un terzo in più).
const MAX_MB_UPLOAD = 30;
const ESTENSIONI_OK = /\.(jpe?g|png|gif|webp|heic|heif|avif|tiff?|mp4|mov|m4v|webm|3gp)$/i;

// Una riga per persona. Gli invitati aggiunti hanno in "Riferimento" il nome dell'invitato principale
// e condividono con lui lo stesso "ID risposta".
const HEADERS = [
  'Data', 'ID risposta', 'Tipo', 'Nome', 'Cognome', 'Presenza', 'Riferimento',
  'Celiaco', 'Vegetariano', 'Vegano', 'Altro', 'Note'
];

// Esegui QUESTA funzione dall'editor per controllare il collegamento (e autorizzare lo script).
function verificaCollegamento() {
  Logger.log('Account che esegue lo script: ' + Session.getEffectiveUser().getEmail());

  const spreadsheet = openSpreadsheet_();
  Logger.log('Foglio aperto: ' + spreadsheet.getName());
  Logger.log('Schede presenti: ' + spreadsheet.getSheets().map(s => '"' + s.getName() + '"').join(', '));

  const sheet = getSheet_();
  Logger.log('OK: le risposte verranno scritte nella scheda "' + sheet.getName() + '".');
}

// Esegui QUESTA funzione dall'editor dopo aver impostato PHOTOS_FOLDER_ID
// (serve anche ad autorizzare l'accesso a Drive).
function verificaCartellaFoto() {
  const folder = DriveApp.getFolderById(PHOTOS_FOLDER_ID);
  Logger.log('Cartella: ' + folder.getName());
  Logger.log('Condivisione: ' + folder.getSharingAccess() + ' / ' + folder.getSharingPermission());
  if (folder.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK && folder.getSharingAccess() !== DriveApp.Access.ANYONE) {
    Logger.log('ATTENZIONE: la cartella non è condivisa con "Chiunque abbia il link": le foto non si vedranno sul sito.');
  }
  CacheService.getScriptCache().remove('foto');
  Logger.log('Foto trovate: ' + listPhotos_().length);
}

// Esegui UNA volta dall'editor: genera la password della dashboard /admin e la scrive nel registro.
// Rieseguila per cambiarla (la vecchia smette di funzionare).
function generaPasswordAdmin() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 20; i++) password += alphabet[Math.floor(Math.random() * alphabet.length)];
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', password);
  Logger.log('Password della dashboard: ' + password);
}

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (error) {
    return json_({ ok: false, error: 'JSON non valido' });
  }

  if (data.action === 'admin') return admin_(data);
  if (data.action === 'photos') return photos_();
  if (data.action === 'upload') return upload_(data);

  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const id = clean_(data.id, 64);
    const persone = Array.isArray(data.persone) ? data.persone.slice(0, MAX_PERSONE) : [];

    if (!id) throw new Error('ID risposta mancante.');
    if (persone.length === 0) throw new Error('Nessuna persona nella risposta.');
    persone.forEach((p, i) => {
      if (!clean_(p.nome, 100) || !clean_(p.cognome, 100)) {
        throw new Error('Nome e cognome obbligatori (persona ' + (i + 1) + ').');
      }
    });

    const sheet = getSheet_();

    // Stesso ID già salvato (es. l'ospite ha premuto Invia due volte): non duplicare.
    if (alreadySaved_(sheet, id)) return json_({ ok: true, duplicato: true });

    const now = new Date();
    const principale = persone[0];
    const riferimento = clean_(principale.nome, 100) + ' ' + clean_(principale.cognome, 100);

    const rows = persone.map((p, i) => {
      const isMain = i === 0;
      const presente = isMain ? p.presenza === true : true; // gli invitati aggiunti sono sempre presenti
      return [
        now,
        id,
        isMain ? 'Principale' : 'Accompagnatore',
        clean_(p.nome, 100),
        clean_(p.cognome, 100),
        presente,
        isMain ? '' : riferimento,
        presente && p.celiaco === true,
        presente && p.vegetariano === true,
        presente && p.vegano === true,
        presente ? clean_(p.altro, 500) : '',
        clean_(p.note, 2000)
      ];
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

// Dashboard: restituisce tutte le righe, solo con la password giusta.
function admin_(data) {
  try {
    const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
    if (!expected) {
      return json_({ ok: false, error: 'not_configured' });
    }
    if (String(data.password || '') !== expected) {
      Utilities.sleep(800); // rallenta i tentativi a caso
      return json_({ ok: false, error: 'unauthorized' });
    }

    const sheet = getSheet_();
    const values = sheet.getDataRange().getValues().slice(1);
    const rows = values
      .filter(r => r[1] !== '')
      .map(r => ({
        data: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
        id: String(r[1]),
        tipo: String(r[2]),
        nome: String(r[3]),
        cognome: String(r[4]),
        presenza: bool_(r[5]),
        riferimento: String(r[6]),
        celiaco: bool_(r[7]),
        vegetariano: bool_(r[8]),
        vegano: bool_(r[9]),
        altro: String(r[10]),
        note: String(r[11])
      }));

    return json_({ ok: true, aggiornato: new Date().toISOString(), rows: rows });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  }
}

// Galleria: elenco pubblico delle foto (solo ID e data, niente nomi dei file).
function photos_() {
  try {
    if (!PHOTOS_FOLDER_ID) return json_({ ok: false, error: 'not_configured' });

    const cache = CacheService.getScriptCache();
    const cached = cache.get('foto');
    if (cached) return json_({ ok: true, photos: JSON.parse(cached) });

    const photos = listPhotos_();
    try {
      cache.put('foto', JSON.stringify(photos), CACHE_FOTO_SECONDI);
    } catch (error) {
      // elenco troppo grande per la cache (oltre 100 KB): pazienza, si rilegge ogni volta
    }
    return json_({ ok: true, photos: photos });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  }
}

// Caricamento dal sito: il file arriva in base64 e viene salvato nella cartella delle foto
// con l'account del proprietario dello script (gli ospiti non serve che abbiano Google).
function upload_(data) {
  try {
    if (!PHOTOS_FOLDER_ID) return json_({ ok: false, error: 'not_configured' });

    const nomeOriginale = clean_(data.nome, 150).replace(/[\\/:*?"<>|]/g, '_') || 'foto';
    const mime = clean_(data.mime, 100).toLowerCase();
    const isMedia = mime.indexOf('image/') === 0 || mime.indexOf('video/') === 0;
    if (!isMedia && !ESTENSIONI_OK.test(nomeOriginale)) return json_({ ok: false, error: 'tipo_non_valido' });

    const bytes = Utilities.base64Decode(String(data.dati || ''));
    if (bytes.length === 0) return json_({ ok: false, error: 'file_vuoto' });
    if (bytes.length > MAX_MB_UPLOAD * 1024 * 1024) return json_({ ok: false, error: 'troppo_grande' });

    // Nome nel Drive: data, ora e (se indicato) chi l'ha caricata
    const ospite = clean_(data.ospite, 60).replace(/[\\/:*?"<>|]/g, '');
    const stamp = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd HH.mm.ss');
    const nome = stamp + (ospite ? ' - ' + ospite : '') + ' - ' + nomeOriginale;

    const blob = Utilities.newBlob(bytes, mime || 'application/octet-stream', nome);
    const file = DriveApp.getFolderById(PHOTOS_FOLDER_ID).createFile(blob);
    if (ospite) file.setDescription('Caricata da ' + ospite);

    CacheService.getScriptCache().remove('foto'); // la galleria la mostra subito
    return json_({ ok: true, id: file.getId() });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error) });
  }
}

// Foto (e video) della cartella e delle sottocartelle, dalla più recente.
function listPhotos_() {
  const photos = [];
  const visit = folder => {
    const files = folder.getFiles();
    while (files.hasNext() && photos.length < MAX_FOTO) {
      const file = files.next();
      const mime = file.getMimeType();
      if (file.isTrashed() || !(mime.indexOf('image/') === 0 || mime.indexOf('video/') === 0)) continue;
      photos.push({ id: file.getId(), t: file.getDateCreated().getTime(), v: mime.indexOf('video/') === 0 });
    }
    const subfolders = folder.getFolders();
    while (subfolders.hasNext() && photos.length < MAX_FOTO) visit(subfolders.next());
  };
  visit(DriveApp.getFolderById(PHOTOS_FOLDER_ID));
  return photos.sort((a, b) => b.t - a.t);
}

function bool_(value) {
  // true booleano, oppure testo TRUE / VERO (foglio in italiano)
  if (value === true) return true;
  const text = String(value).trim().toUpperCase();
  return text === 'TRUE' || text === 'VERO';
}

function doGet() {
  return json_({ ok: true, servizio: 'RSVP Simone e Manuela' });
}

// Apre il foglio indicato dall'ID con un messaggio d'errore comprensibile.
function openSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    throw new Error(
      'Impossibile aprire il foglio ' + SPREADSHEET_ID + ' con l\'account ' +
      Session.getEffectiveUser().getEmail() + '. Controlla che l\'ID sia giusto e che questo account ' +
      'possa modificare il foglio. Dettaglio: ' + error.message
    );
  }
}

// Restituisce la scheda delle risposte, creandola se manca.
// Se esiste ma ha colonne di un formato precedente, la rinomina (senza cancellare nulla) e ne crea una nuova.
function getSheet_() {
  const spreadsheet = openSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (sheet && sheet.getLastRow() > 0 && !hasCurrentHeaders_(sheet)) {
    const oldName = SHEET_NAME + ' (vecchio formato ' + Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd HH-mm') + ')';
    sheet.setName(oldName);
    Logger.log('La scheda esistente aveva colonne diverse: rinominata in "' + oldName + '".');
    sheet = null;
  }

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME, 0);
    Logger.log('Creata la scheda "' + SHEET_NAME + '".');
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function hasCurrentHeaders_(sheet) {
  if (sheet.getLastColumn() < HEADERS.length) return false;
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  return HEADERS.every((h, i) => String(current[i]).trim() === h);
}

function alreadySaved_(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  return sheet.getRange(2, 2, lastRow - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext() !== null;
}

function clean_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 2000);
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
