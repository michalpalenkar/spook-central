import { describe, expect, it } from 'vitest'
import { canUsePole, hintAt } from './hints.js'

const T = 16

describe('hintAt', () => {
  const entities = [
    { type: 'ghost', id: 'g', x: 0, y: 0 },
    { type: 'hint', id: 'move', x: 2, y: 1, width: 3, height: 2 },
  ]

  it('returns the hint zone containing the point', () => {
    expect(hintAt(entities, 2 * T, 1 * T, T)).toBe('move')
    expect(hintAt(entities, 5 * T - 1, 3 * T - 1, T)).toBe('move')
  })

  it('shows a zone that requires an ability only once the player has it', () => {
    const gated = [{ type: 'hint', id: 'weakFloor', x: 0, y: 0, width: 2, height: 2, requires: 'pke-meter' }]
    expect(hintAt(gated, T, T, T)).toBeNull()
    expect(hintAt(gated, T, T, T, new Set(['pke-meter']))).toBe('weakFloor')
  })

  it('returns null outside every zone', () => {
    expect(hintAt(entities, 5 * T, 2 * T, T)).toBeNull()
    expect(hintAt(entities, 1 * T, 2 * T, T)).toBeNull()
    expect(hintAt([], 0, 0, T)).toBeNull()
  })
})

describe('canUsePole', () => {
  const pole = { x: 100, feetY: 240 }

  it('needs the player grounded, close and level with the pole', () => {
    expect(canUsePole(pole, { x: 110, feetY: 240, grounded: true }, 12, T)).toBe(true)
    expect(canUsePole(pole, { x: 113, feetY: 240, grounded: true }, 12, T)).toBe(false)
    expect(canUsePole(pole, { x: 100, feetY: 240, grounded: false }, 12, T)).toBe(false)
    expect(canUsePole(pole, { x: 100, feetY: 192, grounded: true }, 12, T)).toBe(false)
  })
})
