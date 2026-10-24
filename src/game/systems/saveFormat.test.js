import { describe, expect, it } from 'vitest'
import { SAVE_VERSION, createSave, migrateSave, validateSave } from './saveFormat.js'

const WORLD = { roomIds: new Set(['hub', 'library']), startRoom: 'hub', defaultMaxHp: 5 }

const valid = (overrides = {}) => ({
  version: SAVE_VERSION,
  roomId: 'library',
  essence: 12,
  maxHp: 5,
  visited: ['hub', 'library'],
  abilities: [],
  flags: [],
  savedAt: 1000,
  ...overrides,
})

describe('createSave', () => {
  it('builds a current-version save from sets or arrays', () => {
    const save = createSave({ roomId: 'hub', essence: 3, maxHp: 5, visited: new Set(['hub']), savedAt: 7 })
    expect(save).toEqual({ version: SAVE_VERSION, roomId: 'hub', essence: 3, maxHp: 5, visited: ['hub'], abilities: [], flags: [], savedAt: 7 })
  })

  it('round-trips through JSON and validation unchanged', () => {
    const save = valid()
    expect(validateSave(JSON.parse(JSON.stringify(save)), WORLD)).toEqual(save)
  })
})

describe('validateSave', () => {
  it('rejects things that are not saves', () => {
    for (const data of [null, 42, 'save', [], {}, { version: 0 }, { version: '1' }, { version: 1.5 }]) {
      expect(validateSave(data, WORLD)).toBeNull()
    }
  })

  it('rejects saves from a newer version of the game', () => {
    expect(validateSave(valid({ version: SAVE_VERSION + 1 }), WORLD)).toBeNull()
  })

  it('falls back to the start room when the saved room no longer exists', () => {
    const save = validateSave(valid({ roomId: 'demolished', visited: ['library'] }), WORLD)
    expect(save.roomId).toBe('hub')
    expect(save.visited).toEqual(['library', 'hub'])
  })

  it('drops unknown rooms and duplicates, and repairs bad fields', () => {
    const save = validateSave(
      valid({ visited: ['hub', 'gone', 'hub', 3], essence: -4, maxHp: 'lots', abilities: ['pke', 9, 'pke'], savedAt: null }),
      WORLD,
    )
    expect(save.visited).toEqual(['hub', 'library'])
    expect(save.essence).toBe(0)
    expect(save.maxHp).toBe(5)
    expect(save.abilities).toEqual(['pke'])
    expect(save.savedAt).toBe(0)
  })

  it('floors fractional counts and treats missing arrays as empty', () => {
    const save = validateSave({ version: 1, roomId: 'hub', essence: 7.9 }, WORLD)
    expect(save).toMatchObject({ essence: 7, maxHp: 5, visited: ['hub'], abilities: [] })
  })
})

describe('migrateSave', () => {
  // A made-up history: v1 stored `geo`, v2 renamed it to `essence`, v3 added abilities.
  const migrations = {
    1: ({ geo, ...rest }) => ({ ...rest, version: 2, essence: geo }),
    2: (save) => ({ ...save, version: 3, abilities: ['pke'] }),
  }

  it('applies each migration in order', () => {
    expect(migrateSave({ version: 1, geo: 9 }, migrations, 3)).toEqual({ version: 3, essence: 9, abilities: ['pke'] })
    expect(migrateSave({ version: 2, essence: 4 }, migrations, 3)).toEqual({ version: 3, essence: 4, abilities: ['pke'] })
  })

  it('leaves a current save alone', () => {
    const save = { version: 3, essence: 1 }
    expect(migrateSave(save, migrations, 3)).toBe(save)
  })

  it('fails when a step is missing or misbehaves', () => {
    expect(migrateSave({ version: 1 }, { 1: migrations[1] }, 3)).toBeNull()
    expect(migrateSave({ version: 1 }, { 1: () => ({ version: 3 }) }, 3)).toBeNull()
    expect(migrateSave({ version: 1 }, { 1: () => null }, 3)).toBeNull()
  })
})

describe('save version 2', () => {
  it('migrates a version 1 save by adding empty flags', () => {
    const v1 = { version: 1, roomId: 'library', essence: 4, maxHp: 5, visited: ['hub', 'library'], abilities: [], savedAt: 9 }
    expect(validateSave(v1, WORLD)).toEqual({ ...v1, version: 2, flags: [] })
  })

  it('keeps abilities and flags as unique strings', () => {
    const save = validateSave(valid({ abilities: ['pke-meter', 3, 'pke-meter'], flags: ['librarian-defeated', null] }), WORLD)
    expect(save.abilities).toEqual(['pke-meter'])
    expect(save.flags).toEqual(['librarian-defeated'])
    expect(validateSave(valid({ flags: 'nope' }), WORLD).flags).toEqual([])
  })
})

