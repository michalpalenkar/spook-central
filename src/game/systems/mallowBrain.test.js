import { describe, expect, it } from 'vitest'
import { MALLOW, PROJECTILE } from '../constants.js'
import { damageGhost } from './ghostState.js'
import {
  MALLOW_STATE,
  createMallowBrain,
  lobVelocity,
  mallowCapturable,
  mallowCaptured,
  mallowCore,
  mallowDealsContactDamage,
  phaseSpeed,
  startMallowCapture,
  stepMallow,
} from './mallowBrain.js'

const DT = 1 / 60
const FLOOR = 240
const ctx = (overrides = {}) => ({
  playerX: 100,
  triggered: true,
  floorY: FLOOR,
  minX: 20,
  maxX: 700,
  globGravity: PROJECTILE.GLOB_GRAVITY,
  throwFrom: 40,
  ...overrides,
})

function run(brain, seconds, overrides) {
  const events = []
  for (let t = 0; t < seconds; t += DT) events.push(stepMallow(brain, ctx(overrides), DT))
  return events
}

function awake(x = 400) {
  const brain = createMallowBrain(x, FLOOR)
  run(brain, MALLOW.WAKE_TIME + 2 * DT)
  return brain
}

describe('mallow brain', () => {
  it('waits until the player walks in, then wakes and walks toward them', () => {
    const brain = createMallowBrain(400, FLOOR)
    run(brain, 1, { triggered: false })
    expect(brain.state).toBe(MALLOW_STATE.DORMANT)
    expect(mallowDealsContactDamage(brain)).toBe(false)
    expect(stepMallow(brain, ctx(), DT).woke).toBe(true)
    run(brain, MALLOW.WAKE_TIME + DT)
    expect(brain.state).toBe(MALLOW_STATE.WALK)
    const x = brain.x
    run(brain, 0.5)
    expect(brain.x).toBeLessThan(x)
    expect(brain.facing).toBe(-1)
  })

  it('stomps: crouches, leaps toward the player and lands with an event', () => {
    const brain = awake()
    const events = run(brain, MALLOW.WALK_TIME + MALLOW.STOMP_WINDUP + 1.2)
    const states = new Set()
    expect(events.filter((e) => e.landed)).toHaveLength(1)
    expect(brain.feetY).toBe(FLOOR)
    run(brain, 0.1).forEach(() => states.add(brain.state))
    expect(brain.x).toBeLessThan(400)
  })

  it('then throws a volley of globs that land around the player', () => {
    const brain = awake()
    brain.attacks = 1
    brain.state = MALLOW_STATE.WALK
    brain.timer = MALLOW.WALK_TIME
    const events = run(brain, MALLOW.THROW_INTERVAL * (MALLOW.THROW_COUNT + 1))
    const globs = events.flatMap((e) => e.globs)
    expect(globs).toHaveLength(MALLOW.THROW_COUNT)
    // The first glob lands on the player.
    const g = globs[0]
    const t = MALLOW.THROW_FLIGHT_TIME
    expect(g.x + g.vx * t).toBeCloseTo(100, 0)
    expect(g.y + g.vy * t + 0.5 * PROJECTILE.GLOB_GRAVITY * t * t).toBeCloseTo(FLOOR, 0)
  })

  it('kneels when worn down, lowering his head into trap range', () => {
    const brain = awake()
    const standing = mallowCore(brain).y
    damageGhost(brain.health, MALLOW.MAX_HP, MALLOW)
    expect(run(brain, DT)[0].kneeled).toBe(true)
    expect(brain.state).toBe(MALLOW_STATE.KNEEL)
    expect(mallowCapturable(brain)).toBe(true)
    expect(mallowDealsContactDamage(brain)).toBe(false)
    expect(mallowCore(brain).y).toBeGreaterThan(standing)
    expect(FLOOR - mallowCore(brain).y).toBe(MALLOW.KNEEL_CORE_HEIGHT)
  })

  it('waits until he lands before kneeling mid-stomp', () => {
    const brain = awake()
    brain.state = MALLOW_STATE.AIRBORNE
    brain.vy = -100
    brain.feetY = FLOOR - 20
    damageGhost(brain.health, MALLOW.MAX_HP, MALLOW)
    run(brain, 0.05)
    expect(brain.state).toBe(MALLOW_STATE.AIRBORNE)
    run(brain, 1)
    expect(brain.state).toBe(MALLOW_STATE.KNEEL)
  })

  it('gets back up if not trapped in time', () => {
    const brain = awake()
    damageGhost(brain.health, MALLOW.MAX_HP, MALLOW)
    const events = run(brain, MALLOW.RECOVER_DELAY + 4)
    expect(events.some((e) => e.recovered)).toBe(true)
    expect(brain.state).not.toBe(MALLOW_STATE.KNEEL)
  })

  it('takes PHASES traps, coming back faster each time', () => {
    const brain = awake()
    for (let phase = 1; phase < MALLOW.PHASES; phase++) {
      expect(phaseSpeed(brain)).toBeCloseTo(1 + (phase - 1) * MALLOW.PHASE_SPEED_STEP)
      startMallowCapture(brain)
      expect(mallowCaptured(brain)).toBe(false)
      expect(brain).toMatchObject({ state: MALLOW_STATE.ROAR, phase: phase + 1 })
      expect(brain.health.hp).toBe(MALLOW.MAX_HP)
    }
    startMallowCapture(brain)
    expect(mallowCaptured(brain)).toBe(true)
    expect(brain.state).toBe(MALLOW_STATE.DEFEATED)
  })

  it('stays inside the arena', () => {
    const brain = awake(30)
    run(brain, 1.5, { playerX: -500 })
    expect(brain.x).toBeGreaterThanOrEqual(20)
  })
})

describe('lobVelocity', () => {
  it('lands at the target after the given time', () => {
    const { vx, vy } = lobVelocity(0, 0, 90, 30, 0.9, 600)
    expect(vx * 0.9).toBeCloseTo(90)
    expect(vy * 0.9 + 0.5 * 600 * 0.81).toBeCloseTo(30)
  })
})
