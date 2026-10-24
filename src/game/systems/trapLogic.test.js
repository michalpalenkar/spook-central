import { describe, expect, it } from 'vitest'
import { TRAP } from '../constants.js'
import {
  TRAP_STATE,
  canThrow,
  captureProgress,
  createTrap,
  findCaptureTarget,
  recallTrap,
  stepTrap,
  throwTrap,
  throwVelocity,
} from './trapLogic.js'

const TUNING = {
  ...TRAP,
  THROW_SPEED_Y: 200,
  THROW_SPEED_X: 100,
  MAX_THROW_SPEED_X: 250,
  GRAVITY: 800,
  CAPTURE_HALF_WIDTH: 20,
  CAPTURE_HEIGHT: 80,
  CAPTURE_TIME: 0.5,
  ARMED_TIME: 2,
  CLOSED_TIME: 0.5,
  COOLDOWN: 0.25,
  MAX_FLIGHT_TIME: 2,
}

const ground = (candidates = []) => ({ x: 100, y: 200, grounded: true, candidates })
const air = { x: 100, y: 150, grounded: false, candidates: [] }

describe('trap throw', () => {
  it('lobs forward without a target', () => {
    expect(throwVelocity(0, null, -1, TUNING)).toEqual({ vx: -100, vy: -200 })
  })

  it('aims to land beneath a target on flat ground', () => {
    const { vx, vy } = throwVelocity(50, 110, 1, TUNING)
    const flightTime = (2 * -vy) / TUNING.GRAVITY
    expect(50 + vx * flightTime).toBeCloseTo(110)
  })

  it('clamps the aimed throw speed', () => {
    expect(throwVelocity(0, 10000, 1, TUNING).vx).toBe(250)
    expect(throwVelocity(0, -10000, 1, TUNING).vx).toBe(-250)
  })

  it('can only be thrown when ready and off cooldown', () => {
    const trap = createTrap()
    expect(throwTrap(trap)).toBe(true)
    expect(trap.state).toBe(TRAP_STATE.THROWN)
    expect(throwTrap(trap)).toBe(false)
    recallTrap(trap, TUNING)
    expect(canThrow(trap)).toBe(false)
    stepTrap(trap, ground(), 0.3, TUNING)
    expect(canThrow(trap)).toBe(true)
  })
})

describe('capture cone', () => {
  const capturable = (id, x, y) => ({ id, x, y, capturable: true })

  it('takes a weakened ghost above the trap', () => {
    expect(findCaptureTarget(100, 200, [capturable('a', 105, 150)], TUNING)).toBe('a')
  })

  it('ignores ghosts that are not weakened, below, too high or off to the side', () => {
    const candidates = [
      { id: 'strong', x: 100, y: 150, capturable: false },
      capturable('below', 100, 210),
      capturable('high', 100, 100),
      capturable('side', 130, 160),
    ]
    expect(findCaptureTarget(100, 200, candidates, TUNING)).toBe(null)
  })

  it('narrows toward the trap', () => {
    // At the top the half-width is 20, right above the trap it is 10.
    expect(findCaptureTarget(100, 200, [capturable('a', 118, 121)], TUNING)).toBe('a')
    expect(findCaptureTarget(100, 200, [capturable('a', 115, 199)], TUNING)).toBe(null)
  })

  it('picks the nearest of several', () => {
    const candidates = [capturable('far', 100, 130), capturable('near', 100, 180)]
    expect(findCaptureTarget(100, 200, candidates, TUNING)).toBe('near')
  })
})

describe('trap state machine', () => {
  it('arms on landing', () => {
    const trap = createTrap()
    throwTrap(trap)
    expect(stepTrap(trap, air, 0.1, TUNING).armed).toBe(false)
    expect(stepTrap(trap, ground(), 0.1, TUNING).armed).toBe(true)
    expect(trap.state).toBe(TRAP_STATE.ARMED)
  })

  it('arms anyway if it never lands', () => {
    const trap = createTrap()
    throwTrap(trap)
    stepTrap(trap, air, 1.9, TUNING)
    expect(stepTrap(trap, air, 0.1, TUNING).armed).toBe(true)
  })

  it('runs the full capture: armed → capturing → captured → closed → returned', () => {
    const trap = createTrap()
    throwTrap(trap)
    stepTrap(trap, ground(), 0.016, TUNING)

    const ghost = { id: 'g', x: 100, y: 160, capturable: true }
    const started = stepTrap(trap, ground([ghost]), 0.016, TUNING)
    expect(started.captureStarted).toBe('g')
    expect(trap.state).toBe(TRAP_STATE.CAPTURING)

    stepTrap(trap, ground(), 0.25, TUNING)
    expect(captureProgress(trap, TUNING)).toBeCloseTo(0.5)

    const done = stepTrap(trap, ground(), 0.25, TUNING)
    expect(done.captured).toBe('g')
    expect(trap.state).toBe(TRAP_STATE.CLOSED)

    stepTrap(trap, ground(), 0.4, TUNING)
    expect(stepTrap(trap, ground(), 0.1, TUNING).returned).toBe(true)
    expect(trap.state).toBe(TRAP_STATE.READY)
  })

  it('does not capture a ghost that is not weakened', () => {
    const trap = createTrap()
    throwTrap(trap)
    stepTrap(trap, ground(), 0.016, TUNING)
    const events = stepTrap(trap, ground([{ id: 'g', x: 100, y: 160, capturable: false }]), 0.016, TUNING)
    expect(events.captureStarted).toBe(null)
    expect(trap.state).toBe(TRAP_STATE.ARMED)
  })

  it('closes empty after ARMED_TIME and comes back', () => {
    const trap = createTrap()
    throwTrap(trap)
    stepTrap(trap, ground(), 0.016, TUNING)
    stepTrap(trap, ground(), 1.9, TUNING)
    expect(trap.state).toBe(TRAP_STATE.ARMED)
    stepTrap(trap, ground(), 0.1, TUNING)
    expect(trap.state).toBe(TRAP_STATE.CLOSED)
    expect(trap.targetId).toBe(null)
  })
})
