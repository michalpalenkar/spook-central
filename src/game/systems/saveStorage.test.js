import { describe, expect, it } from 'vitest'
import { SAVE_VERSION } from './saveFormat.js'
import { SAVE_KEY, clearSave, loadSave, writeSave } from './saveStorage.js'

const WORLD = { roomIds: new Set(['hub']), startRoom: 'hub', defaultMaxHp: 5 }
const SAVE = { version: SAVE_VERSION, roomId: 'hub', essence: 2, maxHp: 5, visited: ['hub'], abilities: [], flags: [], savedAt: 1 }

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    data,
  }
}

const failing = (error = new Error('SecurityError')) => ({
  getItem: () => {
    throw error
  },
  setItem: () => {
    throw error
  },
  removeItem: () => {
    throw error
  },
})

describe('save storage', () => {
  it('writes and reads back a save', () => {
    const storage = memoryStorage()
    expect(writeSave(SAVE, storage)).toEqual({ ok: true, error: null })
    expect(JSON.parse(storage.data.get(SAVE_KEY))).toEqual(SAVE)
    expect(loadSave(WORLD, storage)).toEqual({ save: SAVE, error: null })
  })

  it('reports no save without an error when the slot is empty', () => {
    expect(loadSave(WORLD, memoryStorage())).toEqual({ save: null, error: null })
  })

  it('reports corrupt JSON and invalid saves', () => {
    expect(loadSave(WORLD, memoryStorage({ [SAVE_KEY]: '{not json' })).error).toBe('corrupt')
    expect(loadSave(WORLD, memoryStorage({ [SAVE_KEY]: '{"version":99}' })).error).toBe('invalid')
    expect(loadSave(WORLD, memoryStorage({ [SAVE_KEY]: 'null' })).error).toBe('invalid')
  })

  it('survives storage that is missing or throws', () => {
    expect(loadSave(WORLD, null)).toEqual({ save: null, error: 'unavailable' })
    expect(writeSave(SAVE, null)).toEqual({ ok: false, error: 'unavailable' })
    expect(loadSave(WORLD, failing())).toEqual({ save: null, error: 'read-failed' })
    expect(writeSave(SAVE, failing(new Error('QuotaExceededError')))).toEqual({ ok: false, error: 'write-failed' })
    expect(clearSave(failing())).toBe(false)
    expect(clearSave(null)).toBe(false)
  })

  it('clears the save', () => {
    const storage = memoryStorage({ [SAVE_KEY]: JSON.stringify(SAVE) })
    expect(clearSave(storage)).toBe(true)
    expect(loadSave(WORLD, storage).save).toBeNull()
  })
})
