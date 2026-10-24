import { describe, expect, it } from 'vitest'
import { GHOST } from '../constants.js'
import {
  GHOST_STATUS,
  canBeCaptured,
  createGhostState,
  damageGhost,
  dealsContactDamage,
  isWeakened,
  resetGhostState,
  tickGhostState,
  weakenThreshold,
} from './ghostState.js'

const TUNING = { ...GHOST, MAX_HP: 100, WEAKEN_FRACTION: 0.3, RECOVER_DELAY: 1, RECOVER_RATE: 10 }

describe('ghost state', () => {
  it('starts at full HP, free and not weakened', () => {
    const ghost = createGhostState(TUNING)
    expect(ghost.hp).toBe(100)
    expect(ghost.status).toBe(GHOST_STATUS.FREE)
    expect(isWeakened(ghost, TUNING)).toBe(false)
    expect(canBeCaptured(ghost, TUNING)).toBe(false)
  })

  it('becomes weakened at the threshold and reports it once', () => {
    const ghost = createGhostState(TUNING)
    expect(weakenThreshold(TUNING)).toBe(30)
    expect(damageGhost(ghost, 69, TUNING)).toBe(false)
    expect(isWeakened(ghost, TUNING)).toBe(false)
    expect(damageGhost(ghost, 1, TUNING)).toBe(true)
    expect(isWeakened(ghost, TUNING)).toBe(true)
    expect(damageGhost(ghost, 5, TUNING)).toBe(false)
  })

  it('cannot be destroyed by the stream', () => {
    const ghost = createGhostState(TUNING)
    damageGhost(ghost, 1000, TUNING)
    expect(ghost.hp).toBe(0)
    expect(ghost.status).toBe(GHOST_STATUS.FREE)
  })

  it('weakened ghosts can be captured and stop dealing contact damage', () => {
    const ghost = createGhostState(TUNING)
    expect(dealsContactDamage(ghost, TUNING)).toBe(true)
    damageGhost(ghost, 80, TUNING)
    expect(canBeCaptured(ghost, TUNING)).toBe(true)
    expect(dealsContactDamage(ghost, TUNING)).toBe(false)
  })

  it('ghosts being captured or already captured take no damage and cannot be captured again', () => {
    const ghost = createGhostState(TUNING)
    damageGhost(ghost, 80, TUNING)
    ghost.status = GHOST_STATUS.CAPTURING
    expect(canBeCaptured(ghost, TUNING)).toBe(false)
    expect(damageGhost(ghost, 10, TUNING)).toBe(false)
    expect(ghost.hp).toBe(20)
    expect(dealsContactDamage(ghost, TUNING)).toBe(false)
  })

  it('recovers only after being left alone for RECOVER_DELAY', () => {
    const ghost = createGhostState(TUNING)
    damageGhost(ghost, 80, TUNING)
    tickGhostState(ghost, 0.9, TUNING)
    expect(ghost.hp).toBe(20)
    tickGhostState(ghost, 0.1, TUNING)
    tickGhostState(ghost, 1, TUNING)
    expect(ghost.hp).toBeCloseTo(31)
    expect(isWeakened(ghost, TUNING)).toBe(false)
    // A new hit restarts the delay.
    damageGhost(ghost, 1, TUNING)
    tickGhostState(ghost, 0.5, TUNING)
    expect(ghost.hp).toBeCloseTo(30)
  })

  it('recovery caps at MAX_HP', () => {
    const ghost = createGhostState(TUNING)
    damageGhost(ghost, 5, TUNING)
    for (let i = 0; i < 100; i++) tickGhostState(ghost, 0.1, TUNING)
    expect(ghost.hp).toBe(100)
  })

  it('reset makes a captured ghost free and full again', () => {
    const ghost = createGhostState(TUNING)
    damageGhost(ghost, 90, TUNING)
    ghost.status = GHOST_STATUS.CAPTURED
    resetGhostState(ghost, TUNING)
    expect(ghost).toEqual(createGhostState(TUNING))
  })
})
