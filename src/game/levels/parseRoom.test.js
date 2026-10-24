import { describe, expect, it } from 'vitest'
import { TILE, parseRoom } from './parseRoom.js'
import { TEST_ROOM } from './testRoom.js'

describe('parseRoom', () => {
  it('parses tiles, size and spawn', () => {
    const room = parseRoom({ id: 'r', grid: ['###', '#P=', '###'] })
    expect(room.width).toBe(3)
    expect(room.height).toBe(3)
    expect(room.spawn).toEqual({ x: 1, y: 1 })
    expect(room.tiles[1]).toEqual([TILE.SOLID, TILE.EMPTY, TILE.PLATFORM])
    expect(room.entities).toEqual([])
    expect(room.exits).toEqual([])
  })

  it('rejects ragged rows', () => {
    expect(() => parseRoom({ id: 'r', grid: ['###', '#P', '###'] })).toThrow(/row 1/)
  })

  it('rejects unknown characters', () => {
    expect(() => parseRoom({ id: 'r', grid: ['#?#', '#P#'] })).toThrow(/unknown tile "\?"/)
  })

  it('requires exactly one spawn', () => {
    expect(() => parseRoom({ id: 'r', grid: ['###'] })).toThrow(/found 0/)
    expect(() => parseRoom({ id: 'r', grid: ['PP#'] })).toThrow(/found 2/)
  })

  it('parses the test room', () => {
    const room = parseRoom(TEST_ROOM)
    expect(room.width).toBe(60)
    expect(room.height).toBe(20)
    // Spawn stands on solid ground.
    expect(room.tiles[room.spawn.y + 1][room.spawn.x]).toBe(TILE.SOLID)
  })
})
