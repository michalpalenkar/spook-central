import { describe, expect, it } from 'vitest'
import { GAME_HEIGHT, STORM } from '../constants.js'
import { createRng } from '../art/rng.js'
import { boltPath, createStorm, flashAlpha, stepStorm } from './stormTiming.js'

describe('storm timing', () => {
  it('strikes first after FIRST_STRIKE_DELAY, then within the random range', () => {
    const storm = createStorm(STORM)
    const rng = createRng(5)
    const dt = 1 / 60
    const strikes = []
    for (let i = 0; i < 60 * 60; i++) if (stepStorm(storm, dt, rng, STORM)) strikes.push(i * dt)
    expect(strikes[0]).toBeCloseTo(STORM.FIRST_STRIKE_DELAY, 1)
    for (let i = 1; i < strikes.length; i++) {
      const gap = strikes[i] - strikes[i - 1]
      expect(gap).toBeGreaterThanOrEqual(STORM.STRIKE_MIN_DELAY - dt)
      expect(gap).toBeLessThanOrEqual(STORM.STRIKE_MAX_DELAY + dt)
    }
    expect(storm.sinceStrike).toBeLessThan(STORM.STRIKE_MAX_DELAY + 1)
  })

  it('flashes bright, dips, flickers again and fades out', () => {
    expect(flashAlpha(0, STORM)).toBeCloseTo(STORM.FLASH_PEAK)
    const dip = flashAlpha(STORM.FLASH_DIP_AT, STORM)
    expect(dip).toBeLessThan(STORM.FLASH_PEAK)
    expect(flashAlpha(STORM.FLASH_SECOND_AT, STORM)).toBeGreaterThan(dip)
    expect(flashAlpha(STORM.FLASH_TIME, STORM)).toBe(0)
    expect(flashAlpha(Infinity, STORM)).toBe(0)
    expect(flashAlpha(-1, STORM)).toBe(0)
    // Never blinding: the play layer stays readable.
    for (let t = 0; t < STORM.FLASH_TIME; t += 0.01) expect(flashAlpha(t, STORM)).toBeLessThanOrEqual(0.35)
  })

  it('draws a bolt from the top down to the given depth', () => {
    const bottom = GAME_HEIGHT * STORM.BOLT_BOTTOM
    const { main, branch } = boltPath(createRng(9), 200, 0, bottom, STORM)
    expect(main).toHaveLength((STORM.BOLT_SEGMENTS + 1) * 2)
    expect(main.slice(0, 2)).toEqual([200, 0])
    expect(main.at(-1)).toBe(Math.round(bottom))
    for (let i = 3; i < main.length; i += 2) expect(main[i]).toBeGreaterThan(main[i - 2])
    if (branch) expect(branch.length).toBeGreaterThan(2)
  })

  it('branches some of the time', () => {
    const results = Array.from({ length: 40 }, (_, i) => boltPath(createRng(i), 100, 0, 150, STORM).branch !== null)
    expect(results.some(Boolean)).toBe(true)
    expect(results.every(Boolean)).toBe(false)
  })
})
