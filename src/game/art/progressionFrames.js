// Hand-drawn pixel art for the progression milestone: Slimer, the Librarian,
// the marshmallow mascot, the Librarian's books, and the relics (ability
// pickups). One character per pixel, `.` transparent; colours are mapped in
// art/progressionTextures.js. Symmetric sprites are drawn as left halves and
// mirrored.

/** Mirrors left-half rows into full rows (even width). */
export function mirrorRows(halves) {
  return halves.map((half) => half + [...half].reverse().join(''))
}

/** Shifts rows `from`..end right by `dx` pixels (a sway), keeping the width. */
export function swayRows(rows, from, dx) {
  return rows.map((row, y) => (y < from ? row : ('.'.repeat(dx) + row).slice(0, row.length)))
}

// Slimer: r rim, b body, s shade, e eyes, m mouth, t tongue.
const SLIMER_TOP = [
  '........rrrrrr........',
  '......rrbbbbbbrr......',
  '.....rbbbbbbbbbbr.....',
  '....rbbbbbbbbbbbbr....',
  '...rbbeeebbbbeeebbr...',
  '...rbbeeebbbbeeebbr...',
  '..rbbbbbbbbbbbbbbbbr..',
  '..rbbbbbbbbbbbbbbbbr..',
]
const SLIMER_BOTTOM = [
  'rsbbbbmmmmmmmmmmbbbbsr',
  'rssbbbbbbbbbbbbbbbbssr',
  '.rssbbbbbbbbbbbbbbssr.',
  '..rssbbbbbbbbbbbbssr..',
  '...rsssbbbbbbbbsssr...',
  '....rrssssssssssrr....',
  '......rrsssssssrr.....',
  '........rrsssrr.......',
  '..........rrr.........',
]
export const SLIMER_FRAMES = {
  chomp0: [
    ...SLIMER_TOP,
    '.rbbmmmmmmmmmmmmmmbbr.',
    '.rbbmmmmmmmmmmmmmmbbr.',
    '.rbbbmmmttttttmmmbbbr.',
    ...SLIMER_BOTTOM,
  ],
  chomp1: [
    ...SLIMER_TOP,
    '.rbbbbbbbbbbbbbbbbbbr.',
    '.rbbbmmmmmmmmmmmmbbbr.',
    '.rbbbbbbbbbbbbbbbbbbr.',
    ...SLIMER_BOTTOM,
  ],
}
export const SLIMER_FRAME_WIDTH = 22
export const SLIMER_FRAME_HEIGHT = 20

// The Librarian: r rim, o robe, s robe shade, f face, h hollow (eyes and
// mouth), H hair in a bun.
const LIBRARIAN_HALF = [
  '........HH',
  '.......HHH',
  '......HHHH',
  '......Hfff',
  '.....rfhhf',
  '.....rffff',
  '.....rfffh',
  '......rfff',
  '.....rrooo',
  '....rooooo',
  '...roooooo',
  '..rooosooo',
  '..rooosooo',
  '.rrooosooo',
  'rfroosoooo',
  '.r.roosooo',
  '...roosooo',
  '...roosooo',
  '...rososoo',
  '...roosooo',
  '....roosoo',
  '....roosoo',
  '....rosooo',
  '.....rosoo',
  '.....rosoo',
  '......roso',
  '......rsoo',
  '.......rso',
  '.......rs.',
  '........r.',
]
const LIBRARIAN_SHRIEK_HALF = LIBRARIAN_HALF.map((row, y) => {
  // Arms flung up, eyes and mouth stretched wide.
  if (y === 4) return '.....rhhhf'
  if (y === 5) return '.....rhhhf'
  if (y === 6) return '.....rffhh'
  if (y === 7) return '......rfhh'
  if (y === 8) return 'f....rrooo'
  if (y === 9) return 'rr..rooooo'
  if (y === 10) return '.rrroooooo'
  if (y === 13) return '..rooosooo'
  if (y === 14) return '..roosoooo'
  if (y === 15) return '...roosooo'
  return row
})
const LIBRARIAN_FLOAT = mirrorRows(LIBRARIAN_HALF)
export const LIBRARIAN_FRAMES = {
  float0: LIBRARIAN_FLOAT,
  float1: swayRows(LIBRARIAN_FLOAT, 20, 1),
  shriek: mirrorRows(LIBRARIAN_SHRIEK_HALF),
}
export const LIBRARIAN_FRAME_WIDTH = 20
export const LIBRARIAN_FRAME_HEIGHT = 30

// The marshmallow mascot: o outline, w body, s shade, h hat, b hat band,
// c collar, B bib, e eyes, m mouth.
const MALLOW_HALF = [
  '..............oooooo',
  '............oohhhhhh',
  '...........ohhhhhhhh',
  '...........ohhhhhhhh',
  '..........ohhhhhhhhh',
  '.........obbbbbbbbbb',
  '.....ooooowwwwwwwwww',
  '....owwwwwwwwwwwwwww',
  '....owwwwwwwwwwwwwww',
  '.....oooowwwwwwwwwww',
  '......owwwwwwwwwwwww',
  '.....owwwwwwwwwwwwww',
  '.....owwwwweewwwwwww',
  '....owwwwwweewwwwwww',
  '....owwwwwwwwwwwwwww',
  '....owwswwwwwwwwwwww',
  '....owwwwwwmwwwwwwww',
  '....owwwwwwwmmmmmmmm',
  '.....owwwwwwwwwwwwww',
  '.....oswwwwwwwwwwwww',
  '......osswwwwwwwwwww',
  '.......ooccccccccccc',
  '.....oocccccccccBBBB',
  '...oowwwcccccccBBBBB',
  '..owwwwwwccccccBBBBB',
  '.owwwwwwwwwwwwwwBBBB',
  'owwwwwwwwwwwwwwwwBBw',
  'owwwwswwwwwwwwwwwwww',
  'owwwwswwwwwwwwwwwwww',
  'owwwwswwwwwwwwwwwwww',
  'owwwsswwwwwwwwwwwwww',
  '.owwsowwwwwwwwwwwwww',
  '.owwsowwwwwwwwwwwwww',
  '..oooowwwwwwwwwwwwww',
  '.....owwwwwwwwwwwwww',
  '.....owwwwwwwwwwwwww',
  '.....oswwwwwwwwwwwww',
  '.....oswwwwwwwwwwwww',
  '......osswwwwwwwwwww',
  '......osswwwwwwwwwww',
  '.......ossswwwwwwwww',
  '........osssswwwwwws',
  '........oswwwwwwwwso',
  '........owwwwwwwwwo.',
  '........owwwwwwwwwo.',
  '........owwwwwwwwwo.',
  '........oswwwwwwwwo.',
  '........oswwwwwwwwo.',
  '........oswwwwwwwwo.',
  '.......oswwwwwwwwwo.',
  '......owwwwwwwwwwwo.',
  '......owwwwwwwwwwwo.',
  '......ooooooooooooo.',
]
// Angry: brows drawn in over the eyes, the smile flattened.
const MALLOW_ANGRY_HALF = MALLOW_HALF.map((row, y) => {
  if (y === 11) return '.....owwwwwoooowwwww'
  if (y === 12) return '.....owwwwweeoowwwww'
  if (y === 16) return '....owwwwwwwwwwwwwww'
  if (y === 17) return '....owwwwwwmmmmmmmmm'
  return row
})
export const MALLOW_FRAMES = {
  stand: mirrorRows(MALLOW_HALF),
  angry: mirrorRows(MALLOW_ANGRY_HALF),
}
export const MALLOW_FRAME_WIDTH = 40
export const MALLOW_FRAME_HEIGHT = 53

// A book flung by the Librarian: c cover, p pages, g gilt spine.
export const BOOK_FRAMES = {
  book0: ['.cccccccc.', 'cgpppppppc', 'cgpppppppc', 'cgpppppppc', 'cgpppppppc', 'cgpppppppc', 'cgpppppppc', '.cccccccc.'],
  book1: ['..cccccc..', '.cpppppcc.', 'cpppppcgc.', 'cppppcggc.', '.cppcgggc.', '..ccggggc.', '...cgggc..', '....ccc...'],
}
export const BOOK_FRAME_WIDTH = 10
export const BOOK_FRAME_HEIGHT = 8

// Relics, 16×16: the ability pickups and the shop's battery cell. m metal,
// M light metal, l red light, e ecto green, b boot leather, d dark.
export const RELIC_FRAMES = {
  'pke-meter': [
    '..M..........M..',
    '..Mm........mM..',
    '...Mm......mM...',
    '....Mm....mM....',
    '.....MmmmmM.....',
    '....mmmmmmmm....',
    '....mMMMMMMm....',
    '....mMlelelm....',
    '....mMMMMMMm....',
    '....mmmmmmmm....',
    '....mmmddmmm....',
    '....mmmddmmm....',
    '.....mmddmm.....',
    '......mddm......',
    '......mddm......',
    '.......mm.......',
  ],
  'ecto-dash': [
    '................',
    '........eeee....',
    '......ee....e...',
    '.....e..eee..e..',
    '....e..e...e.e..',
    '....e.e..e.e.e..',
    '....e.e...ee.e..',
    'MMM.e..e....e...',
    '.....e..eeee....',
    'MMMMM.e.........',
    '.......eeee.....',
    '.MMM.......e....',
    '...........e....',
    '..........e.....',
    '........ee......',
    '................',
  ],
  'slime-boots': [
    '................',
    '.....bbbbb......',
    '.....bMMMb......',
    '.....bbbbb......',
    '.....bbbbb......',
    '.....bbbbb......',
    '.....bbbbb......',
    '.....bbbbbb.....',
    '....ebbbbbbb....',
    '....ebbbbbbbbb..',
    '....ebbbbbbbbbb.',
    '...eebbbbbbbbbb.',
    '...edddddddddddd',
    '...e.e..e....e..',
    '.....e.......e..',
    '................',
  ],
  'battery-cell': [
    '................',
    '......MMMM......',
    '....mmmmmmmm....',
    '....mMMMMMMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMllllMm....',
    '....mMMMMMMm....',
    '....mmmmmmmm....',
    '................',
    '................',
  ],
}
export const RELIC_SIZE = 16

// Crack pattern over a weak floor once the PKE Meter shows it. c crack, d shadow.
export const CRACK_ROWS = [
  '................',
  '.....c..........',
  '.....dc.....c...',
  '......c....cd...',
  '...cc.dc..c.....',
  '..c...cdcc......',
  '.......c.d......',
  '......cd..c.....',
  '.....c.....cc...',
  '....cd.......c..',
  '...c..........c.',
  '..c.............',
  '................',
  '..........c.....',
  '.........cdc....',
  '................',
]
