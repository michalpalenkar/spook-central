import { describe, expect, it } from 'vitest'
import { createHitStop, stepHitStop, triggerHitStop } from './hitStop.js'

describe('hit-stop', () => {
  it('freezes for its duration, then releases', () => {
    const hitStop = createHitStop()
    expect(stepHitStop(hitStop, 1 / 60)).toBe(false)
    triggerHitStop(hitStop, 0.06)
    const frozenFrames = []
    for (let i = 0; i < 6; i++) frozenFrames.push(stepHitStop(hitStop, 1 / 60))
    // 0.06 s at 60 fps is 3.6 frames, so the 4th frame still counts as frozen.
    expect(frozenFrames).toEqual([true, true, true, true, false, false])
  })

  it('does not stack; the longer stop wins', () => {
    const hitStop = createHitStop()
    triggerHitStop(hitStop, 0.1)
    triggerHitStop(hitStop, 0.05)
    expect(hitStop.remaining).toBe(0.1)
    triggerHitStop(hitStop, 0.2)
    expect(hitStop.remaining).toBe(0.2)
  })
})
