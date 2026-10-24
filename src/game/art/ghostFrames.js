// Hand-drawn 20×22 floater ghost. Keys: r rim, b body, s shade, e eyes and
// mouth (see GHOST_COLORS). The tail sways by shifting its rows sideways.

export const GHOST_FRAME_WIDTH = 20
export const GHOST_FRAME_HEIGHT = 22

const TAIL_START_ROW = 13

const BODY = [
  '.......rrrrrr.......',
  '.....rrbbbbbbrr.....',
  '....rbbbbbbbbbbr....',
  '...rbbbbbbbbbbbbr...',
  '..rbbbbbbbbbbbbbbr..',
  '..rbbeeebbbbeeebbr..',
  '.rbbbeeebbbbeeebbbr.',
  '.rbbbeeebbbbeeebbbr.',
  '.rbbbbbbbbbbbbbbbbr.',
  'rbbbbbbbeeeebbbbbbbr',
  'rsbbbbbbeeeebbbbbbsr',
  'rssbbbbbbeebbbbbbssr',
  '.rssbbbbbbbbbbbbssr.',
  '..rsbbbbbbbbbbbbsr..',
  '...rsbbbbbbbbbbsr...',
  '....rsbbbbbbbbsr....',
  '.....rsbbbbbbsr.....',
  '......rssbbbsr......',
  '.......rsbbsr.......',
  '........rssr........',
  '.........rr.........',
  '....................',
]

// Sideways shift of each tail row, top to bottom, for the two sway frames.
const SWAY = {
  left: [0, 0, 0, -1, -1, -1, -2, -2, -2],
  right: [0, 0, 0, 1, 1, 1, 2, 2, 2],
}

export function swayRows(rows, offsets, fromRow) {
  return rows.map((row, y) => {
    const shift = y >= fromRow ? (offsets[y - fromRow] ?? 0) : 0
    if (shift > 0) return '.'.repeat(shift) + row.slice(0, row.length - shift)
    if (shift < 0) return row.slice(-shift) + '.'.repeat(-shift)
    return row
  })
}

export const GHOST_FRAMES = {
  sway0: swayRows(BODY, SWAY.left, TAIL_START_ROW),
  sway1: swayRows(BODY, SWAY.right, TAIL_START_ROW),
}
