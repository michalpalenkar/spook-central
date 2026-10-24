import { describe, expect, it } from 'vitest'
import { HIT_FLASH } from '../constants.js'
import { createHitFlash, hitFlashOn, stepHitFlash } from './hitFlash.js'

const DT = 1 / 60

function run(frames, hit) {
  const flash = createHitFlash()
  const on = []
  for (let i = 0; i < frames; i++) {
    stepHitFlash(flash, DT, hit(i), HIT_FLASH)
    on.push(hitFlashOn(flash, HIT_FLASH))
  }
  return on
}

describe('hit flash', () => {
  it('is off until the first hit', () => {
    expect(hitFlashOn(createHitFlash(), HIT_FLASH)).toBe(false)
  })

  it('flashes at once, then on a rhythm while the stream holds', () => {
    const on = run(60, () => true)
    expect(on[0]).toBe(true)
    const starts = on.map((v, i) => v && !on[i - 1]).flatMap((v, i) => (v ? [i] : []))
    expect(starts.length).toBeGreaterThanOrEqual(3)
    const gap = (starts[1] - starts[0]) * DT
    expect(gap).toBeCloseTo(HIT_FLASH.INTERVAL, 1)
    // Mostly not white: a rhythm, not a strobe.
    expect(on.filter(Boolean).length / on.length).toBeLessThan(0.3)
  })

  it('stops soon after the stream lets go and restarts with the next hit', () => {
    const on = run(40, (i) => i < 10 || i >= 30)
    expect(on.slice(10 + Math.ceil(HIT_FLASH.LINGER / DT) + 1, 30).some(Boolean)).toBe(false)
    expect(on[30]).toBe(true)
  })
})
