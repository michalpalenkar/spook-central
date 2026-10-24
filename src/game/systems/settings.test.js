import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, SETTINGS_KEY, adjustSetting, loadSettings, saveSettings, validateSettings } from './settings.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

describe('validateSettings', () => {
  it('fills in defaults for anything missing or broken', () => {
    expect(validateSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(validateSettings([1, 2])).toEqual(DEFAULT_SETTINGS)
    expect(validateSettings({ volume: 'loud', muted: 'yes', haptics: 0, music: NaN })).toEqual(DEFAULT_SETTINGS)
  })

  it('keeps valid values and drops unknown keys', () => {
    const settings = validateSettings({ volume: 0.3, music: 0, muted: true, touchOpacity: 0.6, haptics: false, cheat: true })
    expect(settings).toEqual({ volume: 0.3, music: 0, muted: true, touchOpacity: 0.6, haptics: false })
  })

  it('clamps and snaps sliders to their grid', () => {
    expect(validateSettings({ volume: 7 }).volume).toBe(1)
    expect(validateSettings({ volume: -1 }).volume).toBe(0)
    expect(validateSettings({ volume: 0.1 + 0.2 }).volume).toBe(0.3)
    expect(validateSettings({ volume: 0.44 }).volume).toBe(0.4)
    // Touch controls never vanish completely.
    expect(validateSettings({ touchOpacity: 0 }).touchOpacity).toBe(0.2)
  })
})

describe('adjustSetting', () => {
  it('steps sliders and stops at the ends', () => {
    let s = { ...DEFAULT_SETTINGS, volume: 0.9 }
    s = adjustSetting(s, 'volume', 1)
    expect(s.volume).toBe(1)
    expect(adjustSetting(s, 'volume', 1).volume).toBe(1)
    expect(adjustSetting(s, 'volume', -1).volume).toBe(0.9)
    expect(adjustSetting({ ...DEFAULT_SETTINGS, touchOpacity: 0.2 }, 'touchOpacity', -1).touchOpacity).toBe(0.2)
  })

  it('flips toggles and ignores unknown keys', () => {
    expect(adjustSetting(DEFAULT_SETTINGS, 'muted').muted).toBe(true)
    expect(adjustSetting(DEFAULT_SETTINGS, 'haptics', -1).haptics).toBe(false)
    expect(adjustSetting(DEFAULT_SETTINGS, 'nope')).toBe(DEFAULT_SETTINGS)
  })

  it('never mutates the input', () => {
    const before = { ...DEFAULT_SETTINGS }
    adjustSetting(before, 'volume', -1)
    adjustSetting(before, 'muted')
    expect(before).toEqual(DEFAULT_SETTINGS)
  })
})

describe('settings storage', () => {
  it('round-trips through storage with a version', () => {
    const storage = memoryStorage()
    const settings = { ...DEFAULT_SETTINGS, volume: 0.4, muted: true }
    expect(saveSettings(settings, storage)).toEqual({ ok: true, error: null })
    expect(JSON.parse(storage.data.get(SETTINGS_KEY)).version).toBe(1)
    expect(loadSettings(storage)).toEqual({ settings, error: null })
  })

  it('gives defaults when nothing is stored', () => {
    expect(loadSettings(memoryStorage())).toEqual({ settings: DEFAULT_SETTINGS, error: null })
  })

  it('reports corrupt, newer, unreadable and unavailable storage', () => {
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{oops' })).error).toBe('corrupt')
    expect(loadSettings(memoryStorage({ [SETTINGS_KEY]: '{"version":99,"volume":0}' }))).toEqual({ settings: DEFAULT_SETTINGS, error: 'corrupt' })
    const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('quota') } }
    expect(loadSettings(throwing).error).toBe('read-failed')
    expect(saveSettings(DEFAULT_SETTINGS, throwing)).toEqual({ ok: false, error: 'write-failed' })
    expect(loadSettings(null)).toEqual({ settings: DEFAULT_SETTINGS, error: 'unavailable' })
    expect(saveSettings(DEFAULT_SETTINGS, null)).toEqual({ ok: false, error: 'unavailable' })
  })

  it('repairs a stored file with bad values', () => {
    const storage = memoryStorage({ [SETTINGS_KEY]: JSON.stringify({ version: 1, volume: 3, haptics: 'no' }) })
    expect(loadSettings(storage).settings).toEqual({ ...DEFAULT_SETTINGS, volume: 1 })
  })
})
