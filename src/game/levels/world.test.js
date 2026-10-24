import { describe, expect, it } from 'vitest'
import { validateWorld } from './exits.js'
import { TILE } from './parseRoom.js'
import { AREAS, ROOMS, START_ROOM, WORLD_INFO, getRoom } from './world.js'
import { HINT_IDS } from '../../ui/hintText.js'

describe('world data', () => {
  it('forms a consistent world', () => {
    expect(validateWorld(ROOMS)).toEqual([])
  })

  it('has 3–6 rooms in each area, all with a known area', () => {
    for (const area of Object.keys(AREAS)) {
      const count = ROOMS.filter((room) => room.area === area).length
      expect(count).toBeGreaterThanOrEqual(3)
      expect(count).toBeLessThanOrEqual(6)
    }
    for (const room of ROOMS) expect(AREAS[room.area]).toBeDefined()
  })

  it('reaches every room from the start, and back', () => {
    const reach = (from, step) => {
      const seen = new Set([from])
      const queue = [from]
      while (queue.length) {
        for (const next of step(queue.shift())) {
          if (seen.has(next)) continue
          seen.add(next)
          queue.push(next)
        }
      }
      return seen
    }
    const forward = reach(START_ROOM, (id) => getRoom(id).exits.map((e) => e.to))
    expect(forward.size).toBe(ROOMS.length)
    const backward = reach(START_ROOM, (id) => ROOMS.filter((r) => r.exits.some((e) => e.to === id)).map((r) => r.id))
    expect(backward.size).toBe(ROOMS.length)
  })

  it('has a new-game spawn only in the start room, standing on solid ground', () => {
    for (const room of ROOMS) {
      if (room.id !== START_ROOM) expect(room.spawn).toBeNull()
    }
    const { spawn, tiles } = getRoom(START_ROOM)
    expect(tiles[spawn.y + 1][spawn.x]).toBe(TILE.SOLID)
  })

  it('puts a fire pole in the start room, standing on solid ground', () => {
    const room = getRoom(START_ROOM)
    const pole = room.entities.find((e) => e.type === 'pole')
    expect(pole).toBeDefined()
    expect(room.tiles[pole.y][pole.x]).toBe(TILE.EMPTY)
    expect(room.tiles[pole.y + 1][pole.x]).toBe(TILE.SOLID)
  })

  it('places ghosts in open air with ids unique across the world', () => {
    const ghosts = ROOMS.flatMap((room) => room.entities.filter((e) => e.type === 'ghost').map((g) => ({ g, room })))
    expect(new Set(ghosts.map(({ g }) => g.id)).size).toBe(ghosts.length)
    for (const { g, room } of ghosts) expect(room.tiles[g.y][g.x]).toBe(TILE.EMPTY)
  })

  it('uses only hint ids that have text, with zones inside the room', () => {
    for (const room of ROOMS) {
      for (const hint of room.entities.filter((e) => e.type === 'hint')) {
        expect(HINT_IDS).toContain(hint.id)
        expect(hint.x + hint.width).toBeLessThanOrEqual(room.width)
        expect(hint.y + hint.height).toBeLessThanOrEqual(room.height)
      }
    }
  })

  it('describes the world for saves', () => {
    expect(WORLD_INFO.startRoom).toBe(START_ROOM)
    expect(WORLD_INFO.roomIds.size).toBe(ROOMS.length)
    expect(WORLD_INFO.roomIds.has('test-room')).toBe(false)
  })
})
