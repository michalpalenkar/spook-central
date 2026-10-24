import { describe, expect, it } from 'vitest'
import { crossedEdge, entryPlacement, exitAt, matchingExit, validateWorld, worldSpan } from './exits.js'
import { parseRoom } from './parseRoom.js'

const T = 16
const TUNING = { ENTRY_INSET: 2, ENTRY_JUMP_VELOCITY: 400 }
const BODY = { halfWidth: 5, halfHeight: 11 }

// Two 6×5 rooms side by side, joined by a 2-tile door, and a third room on
// top of the left one, joined by a hatch.
const west = () =>
  parseRoom({
    id: 'west',
    origin: { x: 0, y: 0 },
    grid: ['#..###', '#.....', '#.....', '######', '######'],
    exits: [
      { edge: 'right', span: [1, 2], to: 'east' },
      { edge: 'top', span: [1, 2], to: 'attic' },
    ],
  })
const east = () =>
  parseRoom({
    id: 'east',
    origin: { x: 6, y: -1 },
    grid: ['######', '######', '.....#', '.....#', '######'],
    exits: [{ edge: 'left', span: [2, 3], to: 'west' }],
  })
const attic = () =>
  parseRoom({
    id: 'attic',
    origin: { x: 0, y: -4 },
    grid: ['######', '#....#', '#....#', '#..###'],
    exits: [{ edge: 'bottom', span: [1, 2], to: 'west' }],
  })

describe('crossedEdge / exitAt', () => {
  it('reports which edge a point has crossed', () => {
    const room = west()
    expect(crossedEdge(room, 10, 10, T)).toBeNull()
    expect(crossedEdge(room, -1, 10, T)).toBe('left')
    expect(crossedEdge(room, 97, 10, T)).toBe('right')
    expect(crossedEdge(room, 10, -1, T)).toBe('top')
    expect(crossedEdge(room, 10, 81, T)).toBe('bottom')
  })

  it('finds the exit whose span contains the point', () => {
    const room = west()
    expect(exitAt(room, 'right', 100, 20, T)).toBe(room.exits[0])
    expect(exitAt(room, 'right', 100, 47, T)).toBe(room.exits[0])
    expect(exitAt(room, 'right', 100, 50, T)).toBeNull()
    expect(exitAt(room, 'top', 40, -2, T)).toBe(room.exits[1])
    expect(exitAt(room, 'top', 60, -2, T)).toBeNull()
  })
})

describe('matchingExit / worldSpan', () => {
  it('converts spans to world tiles', () => {
    expect(worldSpan(east(), east().exits[0])).toEqual([1, 2])
  })

  it('finds the exit leading back', () => {
    const [w, e] = [west(), east()]
    expect(matchingExit(w, w.exits[0], e)).toBe(e.exits[0])
    expect(matchingExit(e, e.exits[0], w)).toBe(w.exits[0])
    expect(matchingExit(w, w.exits[1], e)).toBeNull()
  })
})

describe('entryPlacement', () => {
  it('walks right into the next room, keeping the height in world space', () => {
    const [w, e] = [west(), east()]
    // Feet on the west floor (y = 48): centre at 37. East is one tile higher.
    const body = { ...BODY, x: 100, y: 37, vx: 135, vy: 0 }
    const out = entryPlacement(w, w.exits[0], e, body, T, TUNING)
    expect(out).toEqual({ x: 7, y: 37 + T, vx: 135, vy: 0 })
  })

  it('walks left back into the first room', () => {
    const [w, e] = [west(), east()]
    const body = { ...BODY, x: -1, y: 53, vx: -135, vy: 0 }
    const out = entryPlacement(e, e.exits[0], w, body, T, TUNING)
    expect(out.x).toBe(6 * T - 7)
    expect(out.y).toBe(37)
  })

  it('clamps the body into the opening it comes through', () => {
    const [w, e] = [west(), east()]
    const high = entryPlacement(w, w.exits[0], e, { ...BODY, x: 100, y: 0, vx: 0, vy: 0 }, T, TUNING)
    expect(high.y).toBe(2 * T + BODY.halfHeight)
  })

  it('gives an upward boost when coming up through a floor', () => {
    const [w, a] = [west(), attic()]
    const out = entryPlacement(w, w.exits[1], a, { ...BODY, x: 40, y: -1, vx: 20, vy: -100 }, T, TUNING)
    expect(out.y).toBe(4 * T - BODY.halfHeight - TUNING.ENTRY_INSET)
    expect(out.vy).toBe(-400)
    expect(out.x).toBe(40)
    // A faster rise is kept.
    expect(entryPlacement(w, w.exits[1], a, { ...BODY, x: 40, y: -1, vx: 0, vy: -500 }, T, TUNING).vy).toBe(-500)
  })

  it('drops in from above, keeping the fall speed', () => {
    const [w, a] = [west(), attic()]
    const out = entryPlacement(a, a.exits[0], w, { ...BODY, x: 20, y: 65, vx: 0, vy: 300 }, T, TUNING)
    expect(out).toEqual({ x: T + BODY.halfWidth, y: BODY.halfHeight + TUNING.ENTRY_INSET, vx: 0, vy: 300 })
  })
})

describe('validateWorld', () => {
  it('accepts a consistent world', () => {
    expect(validateWorld([west(), east(), attic()])).toEqual([])
  })

  it('reports unknown targets and missing return exits', () => {
    const w = west()
    w.exits[0].to = 'nowhere'
    expect(validateWorld([w, attic()]).join()).toMatch(/unknown room "nowhere"/)
    const e = east()
    e.exits = []
    const problems = validateWorld([west(), e, attic()]).join('\n')
    expect(problems).toMatch(/"east" has no exit leading back/)
    expect(problems).toMatch(/opening on left edge/)
  })

  it('reports exits that are solid, outside the edge or misaligned', () => {
    const w = west()
    w.exits[0].span = [1, 3]
    expect(validateWorld([w, east(), attic()]).join()).toMatch(/tile 3 is solid/)
    w.exits[0].span = [4, 9]
    expect(validateWorld([w, east(), attic()]).join()).toMatch(/outside the edge/)
    const e = east()
    e.exits[0].span = [2, 2]
    expect(validateWorld([west(), e, attic()]).join()).toMatch(/doesn't line up/)
  })

  it('reports rooms that do not touch or that overlap', () => {
    const e = east()
    e.origin = { x: 7, y: -1 }
    expect(validateWorld([west(), e, attic()]).join()).toMatch(/doesn't touch/)
    const a = attic()
    a.origin = { x: 0, y: -3 }
    expect(validateWorld([west(), east(), a]).join()).toMatch(/overlap/)
  })

  it('reports duplicate ids', () => {
    expect(validateWorld([west(), west()]).join()).toMatch(/duplicate room id "west"/)
  })
})
