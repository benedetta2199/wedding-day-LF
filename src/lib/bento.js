// Disposizione "bento" senza buchi.
//
// 1. Si riempie sempre la PRIMA cella libera (in ordine di lettura). Fra i prossimi `lookahead`
//    elementi si sceglie il primo la cui forma ci sta; se nessuno ci sta, il primo viene ridotto.
//    Così dentro la griglia non restano mai buchi (l'ordine originale è rispettato solo a grandi linee).
// 2. Finiti gli elementi, le celle vuote dell'ultima riga vengono coperte allargando un vicino:
//    il bordo inferiore risulta dritto.
//
// items: [{ size: 'n' | 'wide' | 'tall' | 'big', flexible?: boolean, narrow?: string, dims?: object }]
//   flexible = il contenuto si adatta a qualunque forma (i pensieri): una forma larga diventa alta.
//   narrow   = forma da usare quando c'è una sola colonna libera (es. 'tall' per le polaroid).
//   dims     = misure esatte in celle, al posto di size/narrow (i pensieri, alti quanto il testo):
//              { preferred: [larghezza, altezza], narrow: [1, altezza] }
//   Qualunque altezza va bene: le celle sotto la prima cella libera sono sempre libere.
// Restituisce [{ item, r, c, w, h }] in ordine di lettura (riga, colonna), con indici da 0.

const SHAPES = {
  n: [1, 1],
  wide: [2, 1],
  tall: [1, 2],
  big: [2, 2]
}

// Misure [larghezza, altezza] dell'elemento: quelle preferite, o quelle strette se a destra non c'è posto
function dimsOf(item, roomRight) {
  if (item.dims) return roomRight || item.dims.preferred[0] === 1 ? item.dims.preferred : item.dims.narrow
  return SHAPES[roomRight ? item.size : narrow(item)] || SHAPES.n
}

// Forma da usare quando c'è una sola colonna libera a destra
function narrow(item) {
  if (item.size !== 'wide' && item.size !== 'big') return item.size
  if (item.narrow) return item.narrow
  return item.flexible ? 'tall' : 'n'
}

export function packBento(items, cols, lookahead = 8) {
  const grid = [] // grid[r][c] = indice del riquadro in `placed`
  const placed = []

  const owner = (r, c) => (grid[r] ? grid[r][c] : undefined)
  const isFree = (r, c) => c >= 0 && c < cols && owner(r, c) === undefined
  const fill = (index, tile) => {
    for (let r = tile.r; r < tile.r + tile.h; r++) {
      grid[r] ||= []
      for (let c = tile.c; c < tile.c + tile.w; c++) grid[r][c] = index
    }
  }

  // ---------- 1. Posizionamento ----------
  const pool = items.slice()
  let r = 0
  let c = 0

  while (pool.length) {
    while (!isFree(r, c)) {
      if (++c >= cols) {
        c = 0
        r++
      }
    }

    // La cella sotto è sempre libera (nessun riquadro inizia dopo la prima cella vuota),
    // quindi l'unico vincolo è lo spazio a destra.
    const roomRight = isFree(r, c + 1)
    const width = item => (item.dims ? item.dims.preferred[0] : (SHAPES[item.size] || SHAPES.n)[0])
    const fits = item => roomRight || width(item) === 1

    let pick = pool.findIndex((item, i) => i < lookahead && fits(item))
    if (pick === -1) pick = 0 // nessuno ci sta: il primo prende la forma stretta

    const [w, h] = dimsOf(pool[pick], roomRight)
    const tile = { item: pool.splice(pick, 1)[0], r, c, w, h }
    placed.push(tile)
    fill(placed.length - 1, tile)
  }

  // ---------- 2. Bordo inferiore dritto ----------
  const rows = grid.length
  const columnFree = (tile, col) => {
    for (let y = tile.r; y < tile.r + tile.h; y++) if (!isFree(y, col)) return false
    return true
  }
  const rowFree = (tile, row) => {
    for (let x = tile.c; x < tile.c + tile.w; x++) if (!isFree(row, x)) return false
    return true
  }
  const grow = (index, tile, dw, dh) => {
    tile.w += dw
    tile.h += dh
    fill(index, tile)
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!isFree(y, x)) continue
      const leftIndex = x > 0 ? owner(y, x - 1) : undefined
      const upIndex = y > 0 ? owner(y - 1, x) : undefined
      const left = placed[leftIndex]
      const up = placed[upIndex]

      // Preferenze: forme "naturali" prima (1×1 → 2×1, riquadro basso → alto), poi qualsiasi allargamento.
      if (left && left.w === 1 && left.h === 1 && columnFree(left, x)) grow(leftIndex, left, 1, 0)
      else if (up && up.h === 1 && rowFree(up, y)) grow(upIndex, up, 0, 1)
      else if (left && columnFree(left, x)) grow(leftIndex, left, 1, 0)
      else if (up && rowFree(up, y)) grow(upIndex, up, 0, 1)
    }
  }

  return placed.sort((a, b) => a.r - b.r || a.c - b.c)
}

// Nome della forma finale (per gli stili: righe di testo visibili nei pensieri, ecc.)
export function shapeOf(tile) {
  if (tile.w >= 2 && tile.h >= 2) return 'big'
  if (tile.w >= 2) return 'wide'
  if (tile.h >= 2) return 'tall'
  return 'n'
}
