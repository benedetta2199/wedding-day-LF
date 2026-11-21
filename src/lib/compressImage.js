// Compressione delle foto prima del caricamento su Drive, SENZA ridurre la risoluzione.
//
// - JPEG / WebP → browser-image-compression: ricodifica a qualità 0.85, stessa larghezza e altezza,
//   dati EXIF conservati (l'orientamento viene applicato ai pixel).
// - HEIC (iPhone) → WebP a qualità 0.82 a risoluzione piena: decodifica con heic-to (libheif).
//   Convertirle in JPEG non serve (pesano uguale), in WebP si risparmia il 20-50%.
//   Il WebP del browser non conserva gli EXIF: la data dello scatto viene letta prima con exifreader
//   e restituita a parte (`takenAt`), così l'Apps Script la scrive nella descrizione su Drive.
// - PNG, GIF, video e file sotto i 500 KB restano originali.
//
// In ogni caso si carica l'originale se il risultato risparmia meno del 5%, se non è nel formato
// atteso, se ha dimensioni diverse (es. limiti della canvas su alcuni telefoni) o se qualcosa va storto.
import imageCompression from 'browser-image-compression'
import libURL from 'browser-image-compression/dist/browser-image-compression.js?url'

const JPEG_QUALITY = 0.85
const WEBP_QUALITY = 0.82
const MIN_BYTES = 500 * 1024
const MIN_SAVING = 0.05

const isHeic = file => /^image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
const isJpegOrWebp = file => /^image\/(jpeg|webp)$/i.test(file.type)

export function isCompressible(file) {
  return file.size >= MIN_BYTES && (isJpegOrWebp(file) || isHeic(file))
}

const worthIt = (before, after) => after && after.size <= before.size * (1 - MIN_SAVING)

async function sizeOf(blob) {
  const bitmap = await createImageBitmap(blob)
  const size = { w: bitmap.width, h: bitmap.height }
  bitmap.close?.()
  return size
}

// Data e ora dello scatto dagli EXIF, in formato ISO (null se mancano).
// exifreader legge anche le HEIC degli iPhone recenti (exifr, più vecchia, non le riconosce).
async function readTakenAt(file) {
  try {
    const { default: ExifReader } = await import('exifreader')
    const tags = await ExifReader.load(file)
    const raw = tags.DateTimeOriginal?.description || tags.DateTime?.description // "2026:02:17 18:07:28"
    const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw || '')
    if (!match) return null
    const [, y, mo, d, h, mi, s] = match
    const offset = tags.OffsetTimeOriginal?.description || '' // es. "+02:00"; senza, ora locale
    const date = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}${/^[+-]\d{2}:\d{2}$/.test(offset) ? offset : ''}`)
    return isNaN(date) ? null : date.toISOString()
  } catch {
    return null
  }
}

// HEIC → WebP a risoluzione piena
async function heicToWebp(file) {
  const [{ heicTo }, takenAt] = await Promise.all([import('heic-to'), readTakenAt(file)])
  const bitmap = await heicTo({ blob: file, type: 'bitmap' })
  const { width, height } = bitmap
  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), { width, height })
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  bitmap.close?.()
  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY })
    : await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
  canvas.width = canvas.height = 0 // libera la memoria (24 Mpx = ~100 MB)

  // alcuni browser (Safari) non sanno creare WebP e restituiscono un PNG: in quel caso niente
  if (!blob || blob.type !== 'image/webp' || !worthIt(file, blob)) return { file }
  const name = file.name.replace(/\.(heic|heif)$/i, '') + '.webp'
  return { file: new File([blob], name, { type: 'image/webp', lastModified: file.lastModified }), takenAt }
}

// JPEG / WebP → stesso formato, qualità 0.85, EXIF conservati
async function recompress(file) {
  const compressed = await imageCompression(file, {
    alwaysKeepResolution: true,
    initialQuality: JPEG_QUALITY,
    maxIteration: 1,
    preserveExif: true,
    useWebWorker: true,
    libURL: new URL(libURL, window.location.href).href // il worker si scarica dal sito, non da un CDN
  })
  if (!worthIt(file, compressed)) return { file }
  // su alcuni telefoni la canvas ha un limite di pixel e la libreria rimpicciolirebbe: in quel caso no
  const [before, after] = await Promise.all([sizeOf(file), sizeOf(compressed)])
  if (before.w !== after.w || before.h !== after.h) return { file }
  return { file: new File([compressed], file.name, { type: compressed.type || file.type, lastModified: file.lastModified }) }
}

// Restituisce { file, takenAt? }: il file da caricare (compresso o originale) e, se gli EXIF
// sono andati persi nella conversione, la data dello scatto.
export async function compressImage(file) {
  if (!isCompressible(file)) return { file }
  try {
    return isHeic(file) ? await heicToWebp(file) : await recompress(file)
  } catch (error) {
    console.warn('Compressione non riuscita, carico l’originale:', error)
    return { file }
  }
}
