import { describe, expect, it } from 'vitest'
import { GHOST } from '../constants.js'
import { createSteering, startRecoil, stepSteering } from './ghostSteering.js'

const DT = 1 / 60
const base = { x: 100, y: 100, homeX: 100, homeY: 100, playerX: 500, playerY: 100, tethered: false, weakened: false }

function settle(ctx, frames = 120) {
  const steering = createSteering()
  let behaviour
  for (let i = 0; i < frames; i++) behaviour = stepSteering(steering, ctx, DT)
  return { steering, behaviour }
}

describe('ghost steering', () => {
  it('wanders around home when the player is far away', () => {
    const { steering, behaviour } = settle(base, 1)
    expect(behaviour).toBe('wander')
    expect(Math.hypot(steering.vx, steering.vy)).toBeLessThanOrEqual(GHOST.HOVER_SPEED)
  })

  it('chases a nearby player at CHASE_SPEED', () => {
    const { steering, behaviour } = settle({ ...base, playerX: 180 })
    expect(behaviour).toBe('chase')
    expect(steering.vx).toBeCloseTo(GHOST.CHASE_SPEED, 0)
  })

  it('gives up the chase beyond its leash', () => {
    const { behaviour } = settle({ ...base, x: 100 + GHOST.LEASH_RANGE + 10, playerX: 100 + GHOST.LEASH_RANGE + 60 }, 1)
    expect(behaviour).toBe('wander')
  })

  it('struggles away from the player when tethered', () => {
    const { steering, behaviour } = settle({ ...base, playerX: 60, tethered: true })
    expect(behaviour).toBe('struggle')
    expect(steering.vx).toBeCloseTo(GHOST.STRUGGLE_SPEED, 0)
  })

  it('struggles slower and sinks when weakened', () => {
    const { steering } = settle({ ...base, playerX: 60, tethered: true, weakened: true })
    expect(steering.vx).toBeCloseTo(GHOST.STRUGGLE_SPEED * GHOST.WEAKENED_SPEED_MULTIPLIER, 0)
    expect(steering.vy).toBeCloseTo(GHOST.WEAKENED_SINK_SPEED, 0)
  })

  it('a weakened ghost does not chase', () => {
    const { behaviour } = settle({ ...base, playerX: 150, weakened: true }, 1)
    expect(behaviour).toBe('wander')
  })

  it('backs off from the player after a hit, then resumes', () => {
    const steering = createSteering()
    startRecoil(steering)
    const ctx = { ...base, playerX: 120 }
    expect(stepSteering(steering, ctx, DT)).toBe('recoil')
    for (let i = 0; i < 30; i++) stepSteering(steering, ctx, DT)
    expect(steering.vx).toBeLessThan(0)
    for (let i = 0; i < 60; i++) stepSteering(steering, ctx, DT)
    expect(stepSteering(steering, ctx, DT)).toBe('chase')
  })
})
