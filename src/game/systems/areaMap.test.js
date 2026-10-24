import { describe, expect, it } from 'vitest'
import { isClosedTile, parseRoom } from '../levels/parseRoom.js'
import { ROOMS, START_ROOM } from '../levels/world.js'
import { buildMapView, openRects } from './areaMap.js'

describe('openRects', () => {
  it('merges identical runs in consecutive rows', () => {
    const { tiles } = parseRoom({ id: 'r', grid: ['#####', '#...#', '#...#', '#.#=#', '#####'] })
    expect(openRects(tiles)).toEqual([
      { x: 1, y: 1, width: 3, height: 2 },
      { x: 1, y: 3, width: 1, height: 1 },
      { x: 3, y: 3, width: 1, height: 1 },
    ])
  })

  it('covers exactly the open tiles of a real room', () => {
    for (const room of ROOMS) {
      const area = openRects(room.tiles).reduce((sum, r) => sum + r.width * r.height, 0)
      const open = room.tiles.flat().filter((t) => !isClosedTile(t)).length
      expect(area).toBe(open)
    }
  })
})

describe('buildMapView', () => {
  const T = 16

  it('shows only visited rooms, the current one and the player', () => {
    const view = buildMapView(
      ROOMS,
      { visited: new Set([START_ROOM]), currentRoomId: START_ROOM, player: { x: 32, y: 48 }, saveRoomId: START_ROOM },
      T,
    )
    expect(view.rooms.map((r) => r.id)).toEqual([START_ROOM])
    expect(view.rooms[0]).toMatchObject({ current: true, pole: { x: 20.5, y: 15 }, saved: true, x: 0, y: 0, width: 40, height: 17 })
    expect(view.bounds).toEqual({ x: 0, y: 0, width: 40, height: 17 })
    expect(view.player).toEqual({ x: 2, y: 3 })
    // All four garage exits (one behind the spectral wall) lead somewhere unexplored.
    expect(view.doors).toHaveLength(4)
    expect(view.doors.every((d) => !d.explored)).toBe(true)
  })

  it('fills in as rooms are visited, listing shared doors once', () => {
    const visited = new Set([START_ROOM, 'library-steps'])
    const view = buildMapView(ROOMS, { visited, currentRoomId: 'library-steps' }, T)
    expect(view.rooms.map((r) => r.id).sort()).toEqual([START_ROOM, 'library-steps'])
    expect(view.bounds).toEqual({ x: 0, y: 0, width: 90, height: 17 })
    const shared = view.doors.filter((d) => d.explored)
    expect(shared).toHaveLength(1)
    expect(shared[0]).toMatchObject({ x1: 40, x2: 40, y1: 11, y2: 15 })
    expect(view.player).toBeNull()
  })

  it('is empty before anything is visited', () => {
    const view = buildMapView(ROOMS, { visited: new Set(), currentRoomId: null }, T)
    expect(view).toEqual({ bounds: null, rooms: [], doors: [], player: null })
  })
})
