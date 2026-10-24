import { SETTINGS } from '../constants.js'

// Player settings, kept apart from the save so they survive a new game:
// master and music volume, mute, the touch controls' opacity and haptics.
// Like the save, storage may be missing, blocked or hold anything; every
// call reports problems instead of throwing.

export const SETTINGS_KEY = 'spook-central/settings'
export const SETTINGS_VERSION = 1

export const DEFAULT_SETTINGS = Object.freeze({
  volume: SETTINGS.DEFAULT_VOLUME,
  music: SETTINGS.DEFAULT_MUSIC,
  muted: false,
  touchOpacity: SETTINGS.DEFAULT_TOUCH_OPACITY,
  haptics: true,
})

// Each slider: its range and step.
export const SETTING_RANGES = Object.freeze({
  volume: { min: 0, max: 1, step: SETTINGS.VOLUME_STEP },
  music: { min: 0, max: 1, step: SETTINGS.VOLUME_STEP },
  touchOpacity: { min: SETTINGS.TOUCH_OPACITY_MIN, max: 1, step: SETTINGS.TOUCH_OPACITY_STEP },
})

// Values are kept on the slider's grid, so 0.1 + 0.2 never shows as 31 %.
function snap(value, { min, max, step }) {
  const stepped = Math.round(value / step) * step
  return Number(Math.min(max, Math.max(min, stepped)).toFixed(4))
}

/**
 * A complete, valid settings object from anything: unknown keys are dropped,
 * missing or broken values fall back to the defaults, numbers are clamped
 * and snapped to their slider.
 */
export function validateSettings(data) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  const settings = { ...DEFAULT_SETTINGS }
  for (const [key, range] of Object.entries(SETTING_RANGES)) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) settings[key] = snap(value, range)
  }
  for (const key of ['muted', 'haptics']) {
    if (typeof source[key] === 'boolean') settings[key] = source[key]
  }
  return settings
}

/** Moves a slider one step in `direction` (-1 or 1), or flips a toggle. */
export function adjustSetting(settings, key, direction = 1) {
  const range = SETTING_RANGES[key]
  if (range) return validateSettings({ ...settings, [key]: settings[key] + direction * range.step })
  if (typeof settings[key] === 'boolean') return { ...settings, [key]: !settings[key] }
  return settings
}

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

/** Reads the settings. Returns { settings, error } with error null, 'unavailable', 'read-failed' or 'corrupt'. */
export function loadSettings(storage = defaultStorage()) {
  if (!storage) return { settings: { ...DEFAULT_SETTINGS }, error: 'unavailable' }
  let raw
  try {
    raw = storage.getItem(SETTINGS_KEY)
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, error: 'read-failed' }
  }
  if (raw === null || raw === undefined) return { settings: { ...DEFAULT_SETTINGS }, error: null }
  try {
    const data = JSON.parse(raw)
    // A file from a newer game might mean something else by the same keys.
    if (typeof data?.version === 'number' && data.version > SETTINGS_VERSION) return { settings: { ...DEFAULT_SETTINGS }, error: 'corrupt' }
    return { settings: validateSettings(data), error: null }
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, error: 'corrupt' }
  }
}

/** Writes the settings. Returns { ok, error } with error 'unavailable' or 'write-failed'. */
export function saveSettings(settings, storage = defaultStorage()) {
  if (!storage) return { ok: false, error: 'unavailable' }
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify({ version: SETTINGS_VERSION, ...validateSettings(settings) }))
    return { ok: true, error: null }
  } catch {
    return { ok: false, error: 'write-failed' }
  }
}
