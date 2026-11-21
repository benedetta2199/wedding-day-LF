// Anteprima locale di una foto scelta dall'ospite (URL "blob:" da revocare con URL.revokeObjectURL).
// Chrome, Firefox ed Edge non sanno mostrare le foto HEIC/HEIF degli iPhone: in quel caso la foto
// viene convertita in JPEG nel browser (solo per l'anteprima: su Drive arriva sempre l'originale).
//
// Si usa heic-to perché segue le versioni recenti di libheif: le HEIC degli iPhone con iOS 17/18
// (immagini ausiliarie, HDR) fanno fallire i decodificatori vecchi come quello di heic2any.
// La libreria è pesante, quindi viene scaricata solo quando serve davvero.

const looksHeic = file => /^image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)

const canDisplay = url =>
  new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img.naturalWidth > 0)
    img.onerror = () => resolve(false)
    img.src = url
  })

export async function previewFor(file) {
  // 1. Il browser la sa già mostrare (JPEG, PNG, e HEIC su Safari)
  const direct = URL.createObjectURL(file)
  if (await canDisplay(direct)) return direct
  URL.revokeObjectURL(direct)

  // 2. HEIC: conversione in JPEG. isHeic legge il contenuto del file, perché dal telefono
  //    tipo e nome a volte arrivano vuoti o sbagliati.
  try {
    const { heicTo, isHeic } = await import('heic-to')
    if (!looksHeic(file) && !(await isHeic(file))) return null
    const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.7 })
    return URL.createObjectURL(jpeg)
  } catch (error) {
    console.warn('Anteprima HEIC non riuscita:', error)
    return null
  }
}
