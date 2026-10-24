// HUD pixel art. `#` is a lit pixel; `.` is transparent.

// 3×5 digits for the ecto-essence counter.
export const DIGIT_WIDTH = 3
export const DIGIT_HEIGHT = 5

export const DIGITS = [
  ['###', '#.#', '#.#', '#.#', '###'],
  ['.#.', '##.', '.#.', '.#.', '###'],
  ['###', '..#', '###', '#..', '###'],
  ['###', '..#', '.##', '..#', '###'],
  ['#.#', '#.#', '###', '..#', '..#'],
  ['###', '#..', '###', '..#', '###'],
  ['###', '#..', '###', '#.#', '###'],
  ['###', '..#', '.#.', '.#.', '.#.'],
  ['###', '#.#', '###', '#.#', '###'],
  ['###', '#.#', '###', '..#', '###'],
]

/** Splits a non-negative integer into its decimal digits. */
export function toDigits(value) {
  return String(Math.max(0, Math.floor(value))).split('').map(Number)
}

// 8×12 proton-pack battery cell, shaped like a mask: two terminals for
// horns, eye slits, a tapered chin. Keys: f frame, d frame shadow (and the
// eyes), c charge, k charge core, e empty interior (see the hud palette).
export const CELL_WIDTH = 8
export const CELL_HEIGHT = 12

const CELL = [
  '.f....f.',
  '.ff..ff.',
  'ffffffff',
  'fccccccf',
  'fckkkkcf',
  'fcdkkdcf',
  'fcdkkdcf',
  'fckkkkcf',
  'fccccccf',
  '.fckkcf.',
  '..ffff..',
  '...dd...',
]

export const CELL_FRAMES = {
  full: CELL,
  empty: CELL.map((row) => row.replace(/[ck]/g, 'e')),
}

// Ornaments for the HUD plate: a diamond that starts each rule and a scroll
// that ends it. Keys: o ornament, s its shade.
export const DIAMOND = ['..o..', '.oso.', 'os.so', '.oso.', '..o..']

export const SCROLL = [
  '....ooo..',
  '...o...o.',
  '..o..o..o',
  'ooo.os.so',
  '....o..o.',
  '.....oo..',
]
