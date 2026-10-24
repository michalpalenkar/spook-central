import { describe, expect, it } from 'vitest'
import { PLAYER_COMBAT } from '../constants.js'
import { createDeathSequence, startDeath, stepDeath } from './deathSequence.js'

const TUNING = { ...PLAYER_COMBAT, DEATH_RESPAWN_DELAY: 1, DEATH_FADE_TIME: 0.25 }

describe('death sequence', () => {
  it('does nothing until started', () => {
    expect(stepDeath(createDeathSequence(), 5, TUNING)).toEqual({ fadeOut: false, respawn: false })
  })

  it('fades out near the end and respawns once', () => {
    const death = createDeathSequence()
    expect(startDeath(death, TUNING)).toBe(true)
    expect(startDeath(death, TUNING)).toBe(false)
    const log = []
    // 1/8 s steps are exact in binary floating point.
    for (let i = 0; i < 10; i++) log.push(stepDeath(death, 0.125, TUNING))
    expect(log.filter((e) => e.fadeOut)).toHaveLength(1)
    expect(log.findIndex((e) => e.fadeOut)).toBe(5)
    expect(log.filter((e) => e.respawn)).toHaveLength(1)
    expect(log.findIndex((e) => e.respawn)).toBe(7)
    expect(death.active).toBe(false)
  })
})
