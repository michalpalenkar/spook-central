import { describe, expect, it } from 'vitest'
import { validateWorld } from './exits.js'
import { TILE } from './parseRoom.js'
import { AREAS, ROOMS, START_ROOM, WORLD_INFO, getRoom } from './world.js'
import { SLIMER_CHASE } from './hotel.js'
import { isWallTile } from './parseRoom.js'
import { ABILITY_IDS } from '../systems/abilities.js'
import { BOSSES } from '../systems/bosses.js'
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

  it('has the four areas of the slice', () => {
    expect(Object.keys(AREAS).sort()).toEqual(['firehouse', 'hotel', 'library', 'rooftop'])
  })

  it('stands every fire pole and the shop desk on the floor', () => {
    for (const room of ROOMS) {
      for (const e of room.entities.filter((e) => e.type === 'pole' || e.type === 'shop')) {
        expect(room.tiles[e.y][e.x], `${room.id} ${e.id}`).toBe(TILE.EMPTY)
        expect(isWallTile(room.tiles[e.y + 1][e.x]), `${room.id} ${e.id}`).toBe(true)
      }
    }
  })

  it('has a fire pole in every area', () => {
    for (const area of Object.keys(AREAS)) {
      expect(ROOMS.some((room) => room.area === area && room.entities.some((e) => e.type === 'pole'))).toBe(true)
    }
  })

  it('places known bosses in open air, with drift anchors in the room for the Librarian', () => {
    const bosses = ROOMS.flatMap((room) => room.entities.filter((e) => e.type === 'boss').map((b) => ({ b, room })))
    expect(bosses.map(({ b }) => b.id).sort()).toEqual(['librarian', 'mallow'])
    for (const { b, room } of bosses) {
      expect(BOSSES[b.id]).toBeDefined()
      expect(room.tiles[b.y][b.x]).toBe(TILE.EMPTY)
      expect(b.triggerX).toBeGreaterThan(0)
      for (const a of b.anchors ?? []) expect(room.tiles[a.y][a.x]).toBe(TILE.EMPTY)
    }
  })

  it('runs Slimer’s chase through hotel rooms, ending cornered', () => {
    const stages = SLIMER_CHASE
    expect(stages.at(-1).home).toBeDefined()
    for (const stage of stages) {
      const room = getRoom(stage.roomId)
      expect(room.area).toBe('hotel')
      // He waits inside the room at every waypoint but the last.
      for (const p of (stage.waypoints ?? []).slice(0, -1)) expect(room.tiles[p.y]?.[p.x]).toBeDefined()
    }
    for (const stage of stages.slice(0, -1)) {
      // Every stage but the last ends outside its room.
      const room = getRoom(stage.roomId)
      const last = stage.waypoints.at(-1)
      expect(last.x < 0 || last.y < 0 || last.x >= room.width || last.y >= room.height).toBe(true)
    }
  })

  it('only gates hints on known abilities', () => {
    for (const room of ROOMS) {
      for (const hint of room.entities.filter((e) => e.type === 'hint' && e.requires)) expect(ABILITY_IDS).toContain(hint.requires)
    }
  })
})

