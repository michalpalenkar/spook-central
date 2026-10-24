import { PROJECTILE, TILE_SIZE } from '../constants.js'
import { generateDisc, generateFramedTexture } from './combatTextures.js'
import { drawPixelRows } from './drawPixelRows.js'
import { PALETTE } from './palette.js'
import {
  BOOK_FRAME_HEIGHT,
  BOOK_FRAME_WIDTH,
  BOOK_FRAMES,
  CRACK_ROWS,
  LIBRARIAN_FRAME_HEIGHT,
  LIBRARIAN_FRAME_WIDTH,
  LIBRARIAN_FRAMES,
  MALLOW_FRAME_HEIGHT,
  MALLOW_FRAME_WIDTH,
  MALLOW_FRAMES,
  RELIC_FRAMES,
  RELIC_SIZE,
  SLIMER_FRAME_HEIGHT,
  SLIMER_FRAME_WIDTH,
  SLIMER_FRAMES,
} from './progressionFrames.js'

export const PROGRESSION_TEXTURES = {
  SLIMER: 'slimer',
  LIBRARIAN: 'librarian',
  MALLOW: 'mallow',
  BOOK: 'book',
  GLOB: 'glob',
  RELIC: 'relic',
  CRACK: 'crack',
}

export const PROGRESSION_ANIMS = {
  SLIMER_CHOMP: 'slimer-chomp',
  LIBRARIAN_FLOAT: 'librarian-float',
  BOOK_SPIN: 'book-spin',
}

const SLIMER_CHOMP_FPS = 6
const LIBRARIAN_FLOAT_FPS = 3
const BOOK_SPIN_FPS = 10

/** Slimer, the bosses, their projectiles, relics and the weak-floor crack. */
export function generateProgressionTextures(scene) {
  const slimer = PALETTE.slimer
  generateFramedTexture(scene, PROGRESSION_TEXTURES.SLIMER, SLIMER_FRAMES, {
    r: slimer.rim,
    b: slimer.body,
    s: slimer.shade,
    e: slimer.eyes,
    m: slimer.mouth,
    t: slimer.tongue,
  }, SLIMER_FRAME_WIDTH, SLIMER_FRAME_HEIGHT)
  loop(scene, PROGRESSION_ANIMS.SLIMER_CHOMP, PROGRESSION_TEXTURES.SLIMER, Object.keys(SLIMER_FRAMES), SLIMER_CHOMP_FPS)

  const lib = PALETTE.librarian
  const libColors = { r: lib.rim, o: lib.robe, s: lib.robeShade, f: lib.face, h: lib.hollow, H: lib.hair }
  generateFramedTexture(scene, PROGRESSION_TEXTURES.LIBRARIAN, LIBRARIAN_FRAMES, libColors, LIBRARIAN_FRAME_WIDTH, LIBRARIAN_FRAME_HEIGHT, {
    shriek: { ...libColors, f: lib.scream },
  })
  loop(scene, PROGRESSION_ANIMS.LIBRARIAN_FLOAT, PROGRESSION_TEXTURES.LIBRARIAN, ['float0', 'float1'], LIBRARIAN_FLOAT_FPS)

  const m = PALETTE.mallow
  generateFramedTexture(scene, PROGRESSION_TEXTURES.MALLOW, MALLOW_FRAMES, {
    o: m.outline,
    w: m.body,
    s: m.shade,
    h: m.hat,
    b: m.hatBand,
    c: m.collar,
    B: m.bib,
    e: m.eyes,
    m: m.mouth,
  }, MALLOW_FRAME_WIDTH, MALLOW_FRAME_HEIGHT)

  const p = PALETTE.projectiles
  generateFramedTexture(scene, PROGRESSION_TEXTURES.BOOK, BOOK_FRAMES, { c: p.bookCover, p: p.bookPages, g: p.bookSpine }, BOOK_FRAME_WIDTH, BOOK_FRAME_HEIGHT)
  loop(scene, PROGRESSION_ANIMS.BOOK_SPIN, PROGRESSION_TEXTURES.BOOK, Object.keys(BOOK_FRAMES), BOOK_SPIN_FPS)
  generateDisc(scene, PROGRESSION_TEXTURES.GLOB, PROJECTILE.GLOB_SIZE, p.glob, p.globShade)

  const r = PALETTE.relic
  generateFramedTexture(scene, PROGRESSION_TEXTURES.RELIC, RELIC_FRAMES, {
    m: r.metal,
    M: r.metalLight,
    l: r.light,
    e: r.ecto,
    b: r.boot,
    d: PALETTE.void,
  }, RELIC_SIZE, RELIC_SIZE)

  const crack = scene.textures.createCanvas(PROGRESSION_TEXTURES.CRACK, TILE_SIZE, TILE_SIZE)
  drawPixelRows(crack.context, CRACK_ROWS, { c: PALETTE.gates.crack, d: PALETTE.gates.crackShadow }, 0, 0)
  crack.refresh()
}

function loop(scene, key, texture, frames, frameRate) {
  scene.anims.create({ key, frames: frames.map((frame) => ({ key: texture, frame })), frameRate, repeat: -1 })
}
