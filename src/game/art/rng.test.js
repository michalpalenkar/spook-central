import { describe, expect, it } from 'vitest'
import { createRng, intOf, pickOf, rangeOf, seedFrom } from './rng.js'

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 5 }, a)
    expect(Array.from({ length: 5 }, b)).toEqual(seqA)
    expect(Array.from({ length: 5 }, createRng(43))).not.toEqual(seqA)
  })

  it('stays in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('helpers stay in range', () => {
    const rng = createRng(1)
    for (let i = 0; i < 200; i++) {
      const f = rangeOf(rng, -3, 5)
      expect(f).toBeGreaterThanOrEqual(-3)
      expect(f).toBeLessThan(5)
      const n = intOf(rng, 2, 4)
      expect([2, 3, 4]).toContain(n)
      expect(['a', 'b']).toContain(pickOf(rng, ['a', 'b']))
    }
  })
})

describe('seedFrom', () => {
  it('is stable and differs between keys', () => {
    expect(seedFrom('scenery-library-in-far', 1984)).toBe(seedFrom('scenery-library-in-far', 1984))
    expect(seedFrom('scenery-library-in-far', 1984)).not.toBe(seedFrom('scenery-library-in-mid', 1984))
    expect(seedFrom('a', 1)).not.toBe(seedFrom('a', 2))
  })
})
