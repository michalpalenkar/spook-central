import { validateSave } from './saveFormat.js'

export const SAVE_KEY = 'spook-central/save'

// localStorage can be missing, blocked (private modes, disabled cookies),
// full, or hold anything at all. None of that may crash the game: every call
// reports what went wrong instead of throwing.

function defaultStorage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Some browsers throw on the property access itself when storage is blocked.
    return null
  }
}

/**
 * Reads and validates the save. Returns { save, error }: `save` is null when
 * there is none or it can't be used; `error` is null, 'unavailable',
 * 'read-failed', 'corrupt' or 'invalid'.
 */
export function loadSave(world, storage = defaultStorage()) {
  if (!storage) return { save: null, error: 'unavailable' }
  let raw
  try {
    raw = storage.getItem(SAVE_KEY)
  } catch {
    return { save: null, error: 'read-failed' }
  }
  if (raw === null || raw === undefined) return { save: null, error: null }

  let data
  try {
    data = JSON.parse(raw)
  } catch {
    return { save: null, error: 'corrupt' }
  }
  const save = validateSave(data, world)
  return save ? { save, error: null } : { save: null, error: 'invalid' }
}

/** Writes the save. Returns { ok, error } with error 'unavailable' or 'write-failed'. */
export function writeSave(save, storage = defaultStorage()) {
  if (!storage) return { ok: false, error: 'unavailable' }
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save))
    return { ok: true, error: null }
  } catch {
    // QuotaExceededError, SecurityError, ...
    return { ok: false, error: 'write-failed' }
  }
}

/** Deletes the save. Returns whether it succeeded. */
export function clearSave(storage = defaultStorage()) {
  if (!storage) return false
  try {
    storage.removeItem(SAVE_KEY)
    return true
  } catch {
    return false
  }
}
