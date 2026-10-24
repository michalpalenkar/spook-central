import { describe, expect, it } from 'vitest'
import { PALETTE } from './palette.js'
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, PLAYER_FRAMES } from './playerFrames.js'

describe('player frames', () => {
  it.each(Object.entries(PLAYER_FRAMES))('%s is 16×24 and uses palette colours', (_name, rows) => {
    expect(rows).toHaveLength(PLAYER_FRAME_HEIGHT)
    for (const row of rows) {
      expect(row).toHaveLength(PLAYER_FRAME_WIDTH)
      for (const char of row) {
        if (char !== '.') expect(PALETTE.player).toHaveProperty(char)
      }
    }
  })

  it.each(Object.entries(PLAYER_FRAMES))('%s draws something in the top row of legs', (_name, rows) => {
    expect(rows[15]).toMatch(/[^.]/)
  })
})
