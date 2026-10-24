import { describe, expect, it } from 'vitest'
import { SLIMER } from '../constants.js'
import { CHASE_MODE, advanceChase, createFlight, slimerInRoom, stepFlight } from './slimerChase.js'

const STAGES = [
  { roomId: 'ballroom', waypoints: [{ x: 0, y: 0 }] },
  { roomId: 'kitchen', waypoints: [{ x: 0, y: 0 }] },
  { roomId: 'corridor', home: { x: 1, y: 1 } },
]
const DT = 1 / 60

describe('slimerInRoom', () => {
  it('finds him in his stage’s room only', () => {
    const progress = { stage: 0 }
    expect(slimerInRoom(progress, STAGES, 'ballroom')).toEqual({ stage: 0, cornered: false })
    expect(slimerInRoom(progress, STAGES, 'lobby')).toBeNull()
  })

  it('skips ahead when the player gets ahead of him, never back', () => {
    const progress = { stage: 0 }
    expect(slimerInRoom(progress, STAGES, 'kitchen')).toEqual({ stage: 1, cornered: false })
    expect(progress.stage).toBe(1)
    expect(slimerInRoom(progress, STAGES, 'ballroom')).toBeNull()
  })

  it('corners him in the last stage', () => {
    expect(slimerInRoom({ stage: 2 }, STAGES, 'corridor')).toEqual({ stage: 2, cornered: true })
  })

  it('advances when he leaves a room', () => {
    const progress = { stage: 0 }
    advanceChase(progress, 0)
    expect(progress.stage).toBe(1)
    advanceChase(progress, 0)
    expect(progress.stage).toBe(1)
  })
})

describe('stepFlight', () => {
  const waypoints = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 200 },
  ]

  it('waits until the player comes within flee range', () => {
    const flight = createFlight(waypoints)
    expect(stepFlight(flight, waypoints, { x: SLIMER.FLEE_RANGE + 10, y: 0 }, DT).fled).toBe(false)
    expect(flight.mode).toBe(CHASE_MODE.WAITING)
    expect(stepFlight(flight, waypoints, { x: SLIMER.FLEE_RANGE - 10, y: 0 }, DT).fled).toBe(true)
    expect(flight.mode).toBe(CHASE_MODE.FLEEING)
  })

  it('flies to the next waypoint at flee speed, then waits again', () => {
    const flight = createFlight(waypoints)
    const player = { x: 0, y: 0 }
    stepFlight(flight, waypoints, player, DT)
    stepFlight(flight, waypoints, player, DT)
    expect(flight.x).toBeCloseTo(SLIMER.FLEE_SPEED * DT)
    for (let i = 0; i < 120 && flight.mode === CHASE_MODE.FLEEING; i++) stepFlight(flight, waypoints, player, DT)
    expect(flight).toMatchObject({ mode: CHASE_MODE.WAITING, waypoint: 1, x: 100, y: 0 })
  })

  it('leaves the room after the last waypoint', () => {
    const flight = createFlight(waypoints)
    let left = false
    for (let i = 0; i < 600 && !left; i++) left = stepFlight(flight, waypoints, { x: flight.x, y: flight.y }, DT).left
    expect(left).toBe(true)
    expect(flight.mode).toBe(CHASE_MODE.GONE)
    expect(stepFlight(flight, waypoints, { x: 0, y: 0 }, DT)).toEqual({ fled: false, left: false })
  })
})
