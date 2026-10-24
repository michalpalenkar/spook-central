import { describe, expect, it } from 'vitest'
import { GHOST_FRAME_HEIGHT, GHOST_FRAME_WIDTH, GHOST_FRAMES, swayRows } from './ghostFrames.js'
import { CELL_FRAMES, CELL_HEIGHT, CELL_WIDTH, DIGIT_HEIGHT, DIGIT_WIDTH, DIGITS, toDigits } from './hudGlyphs.js'
import { TRAP_FRAME_HEIGHT, TRAP_FRAME_WIDTH, TRAP_FRAMES } from './trapFrames.js'

function expectGrid(rows, width, height, allowed) {
  expect(rows).toHaveLength(height)
  for (const row of rows) {
    expect(row).toHaveLength(width)
    expect(row).toMatch(new RegExp(`^[.${allowed}]+$`))
  }
}

describe('combat pixel art', () => {
  it.each(Object.entries(GHOST_FRAMES))('ghost %s is 20×22', (_name, rows) => {
    expectGrid(rows, GHOST_FRAME_WIDTH, GHOST_FRAME_HEIGHT, 'rbse')
  })

  it.each(Object.entries(TRAP_FRAMES))('trap %s is 12×8', (_name, rows) => {
    expectGrid(rows, TRAP_FRAME_WIDTH, TRAP_FRAME_HEIGHT, 'shylp')
  })

  it.each(Object.entries(CELL_FRAMES))('battery cell %s is 8×12', (_name, rows) => {
    expectGrid(rows, CELL_WIDTH, CELL_HEIGHT, 'fdcke')
  })

  it('has ten 3×5 digits', () => {
    expect(DIGITS).toHaveLength(10)
    for (const rows of DIGITS) expectGrid(rows, DIGIT_WIDTH, DIGIT_HEIGHT, '#')
  })

  it('swayRows shifts only rows from the given index, keeping width', () => {
    expect(swayRows(['ab..', '.ab.', '.ab.'], [1, -1], 1)).toEqual(['ab..', '..ab', 'ab..'])
  })

  it('toDigits splits integers', () => {
    expect(toDigits(0)).toEqual([0])
    expect(toDigits(105)).toEqual([1, 0, 5])
    expect(toDigits(-3)).toEqual([0])
  })
})
