import { describe, expect, it } from 'vitest'
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
  mirrorRows,
  swayRows,
} from './progressionFrames.js'
import { ABILITY_IDS } from '../systems/abilities.js'
import { SHOP_ITEMS } from '../systems/shop.js'

const SETS = [
  ['slimer', SLIMER_FRAMES, SLIMER_FRAME_WIDTH, SLIMER_FRAME_HEIGHT],
  ['librarian', LIBRARIAN_FRAMES, LIBRARIAN_FRAME_WIDTH, LIBRARIAN_FRAME_HEIGHT],
  ['mallow', MALLOW_FRAMES, MALLOW_FRAME_WIDTH, MALLOW_FRAME_HEIGHT],
  ['book', BOOK_FRAMES, BOOK_FRAME_WIDTH, BOOK_FRAME_HEIGHT],
  ['relic', RELIC_FRAMES, RELIC_SIZE, RELIC_SIZE],
  ['crack', { crack: CRACK_ROWS }, 16, 16],
]

describe('progression pixel art', () => {
  it.each(SETS)('%s frames are rectangles of the declared size', (_name, frames, width, height) => {
    for (const rows of Object.values(frames)) {
      expect(rows).toHaveLength(height)
      for (const row of rows) expect(row).toHaveLength(width)
    }
  })

  it('has a relic for every ability and shop item', () => {
    for (const id of [...ABILITY_IDS, ...SHOP_ITEMS.map((item) => item.id)]) expect(RELIC_FRAMES[id]).toBeDefined()
  })

  it('mirrors and sways rows', () => {
    expect(mirrorRows(['ab'])).toEqual(['abba'])
    expect(swayRows(['ab..', 'cd..'], 1, 1)).toEqual(['ab..', '.cd.'])
  })
})
