// Hand-drawn 16×24 player frames, facing right. Each character is one pixel;
// `.` is transparent and the rest are keys into PALETTE.player.

export const PLAYER_FRAME_WIDTH = 16
export const PLAYER_FRAME_HEIGHT = 24

const LEGS_START_ROW = 15

// Head, torso and proton pack (rows 0–14).
const TOP = [
  '................',
  '.......oooo.....',
  '......oHHHHo....',
  '......oHHHsso...',
  '......oHHssso...',
  '.......ossso....',
  '.oooooooobbo....',
  '.oPPPoobbhbbo...',
  '.oPrPoobbhbbo...',
  '.oPPPoobbhbbo...',
  '.oPPPoobbbbbo...',
  '.oPPPoobBbbso...',
  '.oPPPookkkkko...',
  '..ooo.obbbbbo...',
  '......obbBbbo...',
]

// Legs and boots (rows 15–23).
const LEGS = {
  idle: [
    '......obbobbo...',
    '......obbobbo...',
    '......obbobbo...',
    '......obBobBo...',
    '......obbobbo...',
    '......obbobbo...',
    '......okkokko...',
    '......okkokkko..',
    '......oooooooo..',
  ],
  stride: [
    '......obbbbbo...',
    '......obbbbbo...',
    '.....obbboobbo..',
    '....obbo...obbo.',
    '...obbo.....obbo',
    '..obbo......obbo',
    '..okko.......oko',
    '.okkko......okko',
    '.ooooo......oooo',
  ],
  passing: [
    '......obbbbbo...',
    '......obbbbbo...',
    '......obbobbbo..',
    '......obbo.obbo.',
    '......obbo.okko.',
    '......obbo..oo..',
    '......okko......',
    '......okkko.....',
    '......ooooo.....',
  ],
  tucked: [
    '......obbbbbo...',
    '......obbbbbbo..',
    '.....obbo.obbo..',
    '....obbo..obbo..',
    '....okko..okko..',
    '....okkko.okkko.',
    '.....oooo.oooo..',
    '................',
    '................',
  ],
  dangling: [
    '......obbbbbo...',
    '......obbobbo...',
    '.....obbo.obbo..',
    '.....obbo.obbo..',
    '....obbo...obbo.',
    '....okko...okko.',
    '...okkko...okkko',
    '...ooooo...ooooo',
    '................',
  ],
}

/** Stacks the top over a set of legs; `bob` shifts the top down for run cycles. */
export function composeFrame(top, legs, bob = 0) {
  const rows = Array.from({ length: PLAYER_FRAME_HEIGHT }, (_, y) =>
    y >= LEGS_START_ROW ? [...legs[y - LEGS_START_ROW]] : [...'.'.repeat(PLAYER_FRAME_WIDTH)],
  )
  top.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      if (char !== '.') rows[y + bob][x] = char
    })
  })
  return rows.map((row) => row.join(''))
}

export const PLAYER_FRAMES = {
  idle: composeFrame(TOP, LEGS.idle),
  run0: composeFrame(TOP, LEGS.stride, 1),
  run1: composeFrame(TOP, LEGS.passing),
  jump: composeFrame(TOP, LEGS.tucked),
  fall: composeFrame(TOP, LEGS.dangling),
}
