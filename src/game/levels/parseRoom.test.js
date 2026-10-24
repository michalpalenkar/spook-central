import { describe, expect, it } from 'vitest'
import { TILE, isWallTile, parseRoom } from './parseRoom.js'
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

  it('parses gate tiles: spectral walls, weak floors, barriers and slime', () => {
    const room = parseRoom({ id: 'r', grid: ['HBES'] })
    expect(room.tiles[0]).toEqual([TILE.SPECTRAL, TILE.WEAK_FLOOR, TILE.BARRIER, TILE.SLIME])
  })

  it('counts every kind of masonry as wall, but not barriers or platforms', () => {
    for (const tile of [TILE.SOLID, TILE.SPECTRAL, TILE.WEAK_FLOOR, TILE.SLIME]) expect(isWallTile(tile)).toBe(true)
    for (const tile of [TILE.EMPTY, TILE.PLATFORM, TILE.BARRIER]) expect(isWallTile(tile)).toBe(false)
  })

  it('rejects ragged rows', () => {
    expect(() => parseRoom({ id: 'r', grid: ['###', '#P', '###'] })).toThrow(/row 1/)
  })

  it('rejects unknown characters', () => {
    expect(() => parseRoom({ id: 'r', grid: ['#?#', '#P#'] })).toThrow(/unknown tile "\?"/)
  })

  it('allows no spawn but rejects several', () => {
    expect(parseRoom({ id: 'r', grid: ['###'] }).spawn).toBeNull()
    expect(() => parseRoom({ id: 'r', grid: ['PP#'] })).toThrow(/2 spawns/)
  })

  it('passes area, name and origin through, with defaults', () => {
    const room = parseRoom({ id: 'r', grid: ['#'], area: 'library', name: 'Stacks', origin: { x: 4, y: -2 } })
    expect(room).toMatchObject({ area: 'library', name: 'Stacks', origin: { x: 4, y: -2 } })
    expect(parseRoom({ id: 'r', grid: ['#'] })).toMatchObject({ area: null, name: 'r', origin: { x: 0, y: 0 } })
  })

  it('parses the test room', () => {
    const room = parseRoom(TEST_ROOM)
    expect(room.width).toBe(78)
    expect(room.height).toBe(20)
    // Spawn stands on solid ground.
    expect(room.tiles[room.spawn.y + 1][room.spawn.x]).toBe(TILE.SOLID)
  })

  it('places every test-room ghost in open air inside the room', () => {
    const room = parseRoom(TEST_ROOM)
    const ghosts = room.entities.filter((e) => e.type === 'ghost')
    expect(ghosts.length).toBeGreaterThan(0)
    expect(new Set(ghosts.map((g) => g.id)).size).toBe(ghosts.length)
    for (const { x, y } of ghosts) expect(room.tiles[y][x]).toBe(TILE.EMPTY)
  })
})
