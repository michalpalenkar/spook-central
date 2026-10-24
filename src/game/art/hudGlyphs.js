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

// 8×12 proton-pack battery cell. Keys: f frame, d frame shadow, c charge,
// k charge core, e empty interior (see the hud palette).
export const CELL_WIDTH = 8
export const CELL_HEIGHT = 12

const CELL = [
  '..ffff..',
  '.dffffd.',
  'ffffffff',
  'fccccccf',
  'fckkkkcf',
  'fckkkkcf',
  'fccccccf',
  'fckkkkcf',
  'fckkkkcf',
  'fccccccf',
  'ffffffff',
  '.dddddd.',
]

export const CELL_FRAMES = {
  full: CELL,
  empty: CELL.map((row) => row.replace(/[ck]/g, 'e')),
}
