import { describe, expect, it } from 'vitest'
import { PROTON_STREAM } from '../constants.js'
import { parseRoom } from '../levels/parseRoom.js'
import { selectStreamTarget, streamEndpoint } from './streamTargeting.js'

const TUNING = { ...PROTON_STREAM, RANGE: 100, TETHER_RANGE: 150, AIM_HALF_ANGLE: 30, SAMPLE_STEP: 4 }

// 30 tiles wide open room with one pillar at column 20.
const { tiles } = parseRoom({
  id: 'stream',
  grid: [
    '##############################',
    '#............................#',
    '#............................#',
    '#...................#........#',
    '#P..................#........#',
    '##############################',
  ],
})

const origin = { x: 160, y: 60 }

describe('proton stream targeting', () => {
  it('acquires a ghost ahead and in range', () => {
    expect(selectStreamTarget(origin, 1, [{ id: 'a', x: 220, y: 60 }], tiles, null, TUNING)).toBe('a')
  })

  it('ignores ghosts behind, out of range or outside the aim cone', () => {
    const candidates = [
      { id: 'behind', x: 120, y: 60 },
      { id: 'far', x: 270, y: 60 },
      { id: 'above', x: 180, y: 20 },
    ]
    expect(selectStreamTarget(origin, 1, candidates, tiles, null, TUNING)).toBe(null)
    expect(selectStreamTarget(origin, -1, candidates, tiles, null, TUNING)).toBe('behind')
  })

  it('picks the nearest of several', () => {
    const candidates = [
      { id: 'b', x: 240, y: 60 },
      { id: 'a', x: 200, y: 66 },
    ]
    expect(selectStreamTarget(origin, 1, candidates, tiles, null, TUNING)).toBe('a')
  })

  it('does not shoot through walls', () => {
    const from = { x: 300, y: 60 }
    expect(selectStreamTarget(from, 1, [{ id: 'a', x: 350, y: 60 }], tiles, null, TUNING)).toBe(null)
  })

  it('keeps a tether beyond the acquire range and behind the player', () => {
    const candidates = [{ id: 'a', x: 160 - 130, y: 60 }]
    expect(selectStreamTarget(origin, 1, candidates, tiles, null, TUNING)).toBe(null)
    expect(selectStreamTarget(origin, 1, candidates, tiles, 'a', TUNING)).toBe('a')
  })

  it('breaks the tether past TETHER_RANGE or when the ghost is gone', () => {
    expect(selectStreamTarget(origin, 1, [{ id: 'a', x: 320, y: 60 }], tiles, 'a', TUNING)).toBe(null)
    expect(selectStreamTarget(origin, 1, [], tiles, 'a', TUNING)).toBe(null)
  })

  it('untethered stream ends at full range or at a wall', () => {
    expect(streamEndpoint(origin, 1, tiles, TUNING)).toEqual({ x: 260, y: 60 })
    const blocked = streamEndpoint({ x: 290, y: 60 }, 1, tiles, TUNING)
    expect(blocked.x).toBeLessThan(320)
    expect(blocked.x).toBeGreaterThan(312)
  })
})
