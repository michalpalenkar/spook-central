import { describe, expect, it } from 'vitest'
import { parseRoom } from '../levels/parseRoom.js'
import { castRay, groundBelow, hasLineOfSight, isSolidAt } from './lineOfSight.js'

const S = 16
const { tiles } = parseRoom({
  id: 'los',
  grid: [
    '##########',
    '#........#',
    '#...#....#',
    '#P..#.==.#',
    '##########',
  ],
})

describe('line of sight', () => {
  it('treats outside the room as solid', () => {
    expect(isSolidAt(tiles, -1, 20, S)).toBe(true)
    expect(isSolidAt(tiles, 20, 1000, S)).toBe(true)
    expect(isSolidAt(tiles, 24, 24, S)).toBe(false)
  })

  it('is clear across open air and one-way platforms', () => {
    expect(hasLineOfSight(tiles, 24, 24, 136, 24, 4, S)).toBe(true)
    expect(hasLineOfSight(tiles, 88, 56, 136, 56, 4, S)).toBe(true)
  })

  it('is blocked by a wall in between', () => {
    expect(hasLineOfSight(tiles, 24, 56, 120, 56, 4, S)).toBe(false)
  })

  it('castRay stops just before the wall', () => {
    const hit = castRay(tiles, 24, 56, 140, 56, 4, S)
    expect(hit.blocked).toBe(true)
    expect(hit.x).toBeLessThan(64)
    expect(hit.x).toBeGreaterThan(56)
    expect(hit.y).toBe(56)
  })

  it('castRay reaches the end when nothing is in the way', () => {
    expect(castRay(tiles, 24, 24, 100, 24, 4, S)).toEqual({ x: 100, y: 24, blocked: false })
  })

  it('groundBelow finds the next solid floor, ignoring platforms', () => {
    expect(groundBelow(tiles, 24, 20, S)).toBe(64)
    expect(groundBelow(tiles, 72, 20, S)).toBe(32)
    expect(groundBelow(tiles, 104, 20, S)).toBe(64)
    expect(groundBelow(tiles, 72, 40, S)).toBe(null)
  })
})
