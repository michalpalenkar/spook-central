import { describe, expect, it } from 'vitest'
import { ATMOSPHERE } from '../constants.js'
import { parseRoom } from '../levels/parseRoom.js'
import { ROOMS } from '../levels/world.js'
import { dustCount } from './dustCount.js'
import { lampSpots } from './lampSpots.js'

const TUNING = { LAMP_SPACING: 4, LAMP_MIN_CLEARANCE: 3, LAMP_MAX: 10, LAMP_CHAIN_MIN: 1, LAMP_CHAIN_MAX: 2 }

describe('lampSpots', () => {
  it('hangs lamps under ceilings with room below, spaced apart', () => {
    const { tiles } = parseRoom({
      id: 'r',
      grid: ['############', '#..........#', '#..........#', '#..........#', '#..........#', '#..........#', '############'],
    })
    const spots = lampSpots(tiles, TUNING)
    expect(spots.map((s) => s.x)).toEqual([1, 5, 9])
    for (const s of spots) {
      expect(s.y).toBe(1)
      expect(s.chain).toBeGreaterThanOrEqual(1)
      expect(s.chain).toBeLessThanOrEqual(2)
    }
  })

  it('skips low ceilings, lone pillar tips and platforms', () => {
    const { tiles } = parseRoom({
      id: 'r',
      grid: ['##########', '#........#', '#..#..====', '#........#', '#........#', '##########'],
    })
    // Row 0 has only 4 open tiles below; the pillar at (3, 2) has no walls beside it.
    expect(lampSpots(tiles, { ...TUNING, LAMP_MIN_CLEARANCE: 5 })).toEqual([])
  })

  it('caps lamps per room, spread across the spots', () => {
    const { tiles } = parseRoom({ id: 'r', grid: ['#'.repeat(40), '#' + '.'.repeat(38) + '#', ...Array(5).fill('#' + '.'.repeat(38) + '#'), '#'.repeat(40)] })
    const spots = lampSpots(tiles, { ...TUNING, LAMP_MAX: 3 })
    expect(spots).toHaveLength(3)
    expect(spots[0].x).toBeGreaterThan(1)
    expect(spots[2].x).toBeLessThan(38)
  })

  it('keeps every real room under the cap, with chains that leave headroom', () => {
    for (const room of ROOMS) {
      const spots = lampSpots(room.tiles, ATMOSPHERE)
      expect(spots.length).toBeLessThanOrEqual(ATMOSPHERE.LAMP_MAX)
      for (const s of spots) expect(s.chain).toBeLessThanOrEqual(ATMOSPHERE.LAMP_CHAIN_MAX)
    }
  })
})

describe('dustCount', () => {
  it('scales with room area within limits', () => {
    expect(dustCount(100, 100, ATMOSPHERE)).toBe(ATMOSPHERE.DUST_MIN)
    expect(dustCount(10000, 10000, ATMOSPHERE)).toBe(ATMOSPHERE.DUST_MAX)
    const mid = dustCount(480, 600, ATMOSPHERE)
    expect(mid).toBeGreaterThan(ATMOSPHERE.DUST_MIN)
    expect(mid).toBeLessThan(ATMOSPHERE.DUST_MAX)
  })
})
