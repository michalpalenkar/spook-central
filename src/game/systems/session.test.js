import { describe, expect, it } from 'vitest'
import { SAVE_VERSION } from './saveFormat.js'
import {
  ENTRY,
  brokenIn,
  checkpointSave,
  markBroken,
  isCaptured,
  markCaptured,
  newSession,
  respawnAtSave,
  restAtPole,
  sessionFromSave,
  travel,
  visitRoom,
} from './session.js'

const WORLD = { startRoom: 'garage', defaultMaxHp: 5 }

describe('session', () => {
  it('starts a new game at the start room spawn', () => {
    const s = newSession(WORLD)
    expect(s).toMatchObject({ roomId: 'garage', entry: { type: ENTRY.SPAWN }, hp: 5, maxHp: 5 })
    expect(s.wallet.essence).toBe(0)
    expect([...s.visited]).toEqual(['garage'])
    expect(s.respawn).toEqual({ roomId: 'garage', entry: ENTRY.SPAWN, essence: 0 })
  })

  it('continues from a save at its fire pole', () => {
    const s = sessionFromSave({ version: SAVE_VERSION, roomId: 'garage', essence: 9, maxHp: 6, visited: ['steps'], abilities: ['pke'] })
    expect(s).toMatchObject({ roomId: 'garage', entry: { type: ENTRY.POLE }, hp: 6, maxHp: 6 })
    expect(s.wallet.essence).toBe(9)
    expect([...s.visited].sort()).toEqual(['garage', 'steps'])
    expect(s.abilities.has('pke')).toBe(true)
  })

  it('tracks visited rooms', () => {
    const s = newSession(WORLD)
    expect(visitRoom(s, 'steps')).toBe(true)
    expect(visitRoom(s, 'steps')).toBe(false)
  })

  it('travels through an exit, carrying HP and placement', () => {
    const s = newSession(WORLD)
    travel(s, 'steps', { x: 7, y: 37, vx: 135, vy: 0 }, 3)
    expect(s).toMatchObject({ roomId: 'steps', entry: { type: ENTRY.EXIT, x: 7, y: 37, vx: 135, vy: 0 }, hp: 3 })
    expect(s.visited.has('steps')).toBe(true)
  })

  it('remembers captured ghosts per room until resting', () => {
    const s = newSession(WORLD)
    markCaptured(s, 'steps', 'g1')
    expect(isCaptured(s, 'steps', 'g1')).toBe(true)
    expect(isCaptured(s, 'other', 'g1')).toBe(false)
    restAtPole(s, 'garage', 0)
    expect(isCaptured(s, 'steps', 'g1')).toBe(false)
  })

  it('resting heals, sets the respawn point and returns the save', () => {
    const s = newSession(WORLD)
    travel(s, 'steps', { x: 0, y: 0, vx: 0, vy: 0 }, 2)
    travel(s, 'garage', { x: 0, y: 0, vx: 0, vy: 0 }, 2)
    s.wallet.essence = 11
    const save = restAtPole(s, 'garage', 1234)
    expect(s.hp).toBe(5)
    expect(s.respawn).toEqual({ roomId: 'garage', entry: ENTRY.POLE, essence: 11 })
    expect(save).toEqual({
      version: SAVE_VERSION,
      roomId: 'garage',
      essence: 11,
      maxHp: 5,
      visited: ['garage', 'steps'],
      abilities: [],
      flags: [],
      savedAt: 1234,
    })
  })

  it('death returns to the last save with its essence, keeping the map', () => {
    const s = newSession(WORLD)
    s.wallet.essence = 4
    restAtPole(s, 'garage', 0)
    travel(s, 'steps', { x: 0, y: 0, vx: 0, vy: 0 }, 1)
    s.wallet.essence = 10
    s.wallet.healProgress = 2
    markCaptured(s, 'steps', 'g1')
    respawnAtSave(s)
    expect(s).toMatchObject({ roomId: 'garage', entry: { type: ENTRY.POLE }, hp: 5 })
    expect(s.wallet).toEqual({ essence: 4, healProgress: 0 })
    expect(s.visited.has('steps')).toBe(true)
    expect(s.captured.size).toBe(0)
  })

  it('death before any save returns to the new-game spawn with no essence', () => {
    const s = newSession(WORLD)
    travel(s, 'steps', { x: 0, y: 0, vx: 0, vy: 0 }, 1)
    s.wallet.essence = 6
    respawnAtSave(s)
    expect(s).toMatchObject({ roomId: 'garage', entry: { type: ENTRY.SPAWN } })
    expect(s.wallet.essence).toBe(0)
  })

  it('continues flags from a save, and starts a new game without any', () => {
    const s = sessionFromSave({ version: SAVE_VERSION, roomId: 'garage', essence: 0, maxHp: 5, visited: [], abilities: [], flags: ['librarian-defeated'] })
    expect(s.flags.has('librarian-defeated')).toBe(true)
    expect(newSession(WORLD).flags.size).toBe(0)
    expect(newSession(WORLD).chase).toEqual({ stage: 0 })
  })

  it('writes a checkpoint at the last pole with the essence held there', () => {
    const s = newSession(WORLD)
    s.wallet.essence = 7
    restAtPole(s, 'garage', 1)
    s.wallet.essence = 19
    s.abilities.add('pke-meter')
    s.flags.add('librarian-defeated')
    travel(s, 'vault', { x: 0, y: 0, vx: 0, vy: 0 }, 3)
    expect(checkpointSave(s, 50)).toMatchObject({
      roomId: 'garage',
      essence: 7,
      abilities: ['pke-meter'],
      flags: ['librarian-defeated'],
      savedAt: 50,
    })
  })

  it('remembers broken weak floors per room, through death', () => {
    const s = newSession(WORLD)
    markBroken(s, 'ballroom', [{ x: 10, y: 15 }, { x: 11, y: 15 }])
    markBroken(s, 'kitchen', [{ x: 1, y: 2 }])
    respawnAtSave(s)
    expect([...brokenIn(s, 'ballroom')].sort()).toEqual(['10,15', '11,15'])
    expect([...brokenIn(s, 'lobby')]).toEqual([])
  })

  it('keeps abilities and flags after death', () => {
    const s = newSession(WORLD)
    s.abilities.add('ecto-dash')
    s.flags.add('slimer-captured')
    respawnAtSave(s)
    expect(s.abilities.has('ecto-dash')).toBe(true)
    expect(s.flags.has('slimer-captured')).toBe(true)
  })
})

