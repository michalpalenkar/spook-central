import { describe, expect, it } from 'vitest'
import { LIBRARIAN } from '../constants.js'
import { damageGhost } from './ghostState.js'
import {
  LIBRARIAN_STATE,
  createLibrarianBrain,
  defeatLibrarian,
  isAwake,
  librarianCapturable,
  librarianDealsContactDamage,
  startLibrarianCapture,
  stepLibrarian,
} from './librarianBrain.js'

const DT = 1 / 60
const ANCHORS = [
  { x: 50, y: 50 },
  { x: 150, y: 50 },
]
const ctx = (overrides = {}) => ({ playerX: 100, playerY: 200, triggered: true, tethered: false, floorY: 240, ...overrides })

function run(brain, seconds, overrides) {
  const events = []
  for (let t = 0; t < seconds; t += DT) events.push(stepLibrarian(brain, ctx(overrides), DT))
  return events
}

describe('librarian brain', () => {
  it('sleeps until the player walks in, then wakes', () => {
    const brain = createLibrarianBrain(100, 80, ANCHORS)
    run(brain, 1, { triggered: false })
    expect(brain.state).toBe(LIBRARIAN_STATE.DORMANT)
    expect(isAwake(brain)).toBe(false)
    expect(stepLibrarian(brain, ctx(), DT).woke).toBe(true)
    expect(brain.state).toBe(LIBRARIAN_STATE.WAKING)
    expect(librarianDealsContactDamage(brain)).toBe(false)
    run(brain, LIBRARIAN.WAKE_TIME + DT)
    expect(brain.state).toBe(LIBRARIAN_STATE.DRIFT)
    expect(librarianDealsContactDamage(brain)).toBe(true)
  })

  it('alternates a volley of books aimed at the player with a swoop', () => {
    const brain = createLibrarianBrain(100, 80, ANCHORS)
    const events = run(brain, LIBRARIAN.WAKE_TIME + LIBRARIAN.DRIFT_TIME + 1.2)
    const books = events.map((e) => e.book).filter(Boolean)
    expect(books).toHaveLength(LIBRARIAN.VOLLEY_BOOKS)
    // Aimed down at the player below her.
    for (const book of books) {
      expect(book.vy).toBeGreaterThan(0)
      expect(Math.hypot(book.vx, book.vy)).toBeCloseTo(LIBRARIAN.BOOK_SPEED)
    }
    const states = new Set()
    for (let t = 0; t < LIBRARIAN.DRIFT_TIME + LIBRARIAN.SWOOP_WINDUP + 0.5; t += DT) {
      stepLibrarian(brain, ctx(), DT)
      states.add(brain.state)
    }
    expect(states.has(LIBRARIAN_STATE.WINDUP)).toBe(true)
    expect(states.has(LIBRARIAN_STATE.SWOOP)).toBe(true)
  })

  it('swoops at where the player was when the wind-up ended', () => {
    const brain = createLibrarianBrain(100, 100, ANCHORS)
    brain.state = LIBRARIAN_STATE.WINDUP
    brain.timer = LIBRARIAN.SWOOP_WINDUP
    stepLibrarian(brain, ctx({ playerX: 200, playerY: 100 }), DT)
    expect(brain.state).toBe(LIBRARIAN_STATE.SWOOP)
    stepLibrarian(brain, ctx({ playerX: 0, playerY: 300 }), DT)
    expect(brain.vx).toBeCloseTo(LIBRARIAN.SWOOP_SPEED)
    expect(brain.vy).toBeCloseTo(0)
  })

  it('is stunned once worn down: harmless, sinking and capturable', () => {
    const brain = createLibrarianBrain(100, 80, ANCHORS)
    run(brain, LIBRARIAN.WAKE_TIME + 0.1)
    damageGhost(brain.health, LIBRARIAN.MAX_HP, LIBRARIAN)
    const [first] = run(brain, DT)
    expect(first.stunned).toBe(true)
    expect(brain.state).toBe(LIBRARIAN_STATE.STUNNED)
    expect(librarianDealsContactDamage(brain)).toBe(false)
    expect(librarianCapturable(brain)).toBe(true)
    const y = brain.y
    run(brain, 0.5)
    expect(brain.y).toBeGreaterThan(y)
  })

  it('never sinks into the floor', () => {
    const brain = createLibrarianBrain(100, 200, ANCHORS)
    brain.state = LIBRARIAN_STATE.STUNNED
    brain.health.hp = 0
    run(brain, 1, { floorY: 230 })
    expect(brain.y).toBeLessThanOrEqual(230 - LIBRARIAN.MIN_HOVER_HEIGHT)
  })

  it('recovers when left alone, angrier', () => {
    const brain = createLibrarianBrain(100, 80, ANCHORS)
    run(brain, LIBRARIAN.WAKE_TIME + 0.1)
    damageGhost(brain.health, LIBRARIAN.MAX_HP, LIBRARIAN)
    const events = run(brain, LIBRARIAN.RECOVER_DELAY + 3)
    expect(events.some((e) => e.recovered)).toBe(true)
    expect(brain.angry).toBe(true)
    expect(librarianCapturable(brain)).toBe(false)
  })

  it('stops while captured and is beaten after', () => {
    const brain = createLibrarianBrain(100, 80, ANCHORS)
    brain.state = LIBRARIAN_STATE.STUNNED
    startLibrarianCapture(brain)
    run(brain, 0.5)
    expect(brain).toMatchObject({ state: LIBRARIAN_STATE.CAPTURING, x: 100, y: 80 })
    defeatLibrarian(brain)
    expect(isAwake(brain)).toBe(false)
    expect(librarianDealsContactDamage(brain)).toBe(false)
  })
})
