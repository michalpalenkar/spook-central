import { describe, expect, it } from 'vitest'
import { createSquash, relaxSquash, squashForLanding, stretchForJump } from './squashStretch.js'

describe('squash and stretch', () => {
  it('stretches on jump and relaxes back to 1', () => {
    const squash = createSquash()
    stretchForJump(squash)
    expect(squash.y).toBeGreaterThan(1)
    for (let i = 0; i < 60; i++) relaxSquash(squash, 1 / 60)
    expect(squash.x).toBeCloseTo(1, 2)
    expect(squash.y).toBeCloseTo(1, 2)
  })

  it('squashes harder on faster landings and not at all on soft ones', () => {
    const soft = createSquash()
    squashForLanding(soft, 50)
    expect(soft).toEqual({ x: 1, y: 1 })

    const medium = createSquash()
    const hard = createSquash()
    squashForLanding(medium, 250)
    squashForLanding(hard, 420)
    expect(medium.y).toBeLessThan(1)
    expect(hard.y).toBeLessThan(medium.y)
  })
})
