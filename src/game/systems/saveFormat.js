// The save file, as stored in localStorage (JSON):
//   { version, roomId, essence, maxHp, visited: [roomId], abilities: [id],
//     flags: [id], savedAt }
// `roomId` is the room of the fire pole the player last rested at. `flags`
// record one-off events: bosses beaten, shop goods bought
// (systems/abilities.js FLAG).
//
// Bump SAVE_VERSION whenever the shape changes, and add a migration from the
// previous version to MIGRATIONS so older saves keep loading.

export const SAVE_VERSION = 2

/**
 * Migrations keyed by the version they upgrade *from*. Each takes a save of
 * that version and returns one of the next version.
 */
export const MIGRATIONS = {
  // v2 adds `flags`. Nothing in v1 could set one, so it starts empty.
  1: (save) => ({ ...save, version: 2, flags: [] }),
}

/**
 * Upgrades a save to `targetVersion` one step at a time. Returns null when a
 * step is missing or the save comes from a newer game than this one.
 */
export function migrateSave(data, migrations = MIGRATIONS, targetVersion = SAVE_VERSION) {
  let save = data
  while (save.version < targetVersion) {
    const migrate = migrations[save.version]
    if (!migrate) return null
    const next = migrate(save)
    if (!next || next.version !== save.version + 1) return null
    save = next
  }
  return save.version === targetVersion ? save : null
}

const isObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value)

const toCount = (value, fallback) =>
  Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback

/**
 * Turns untrusted parsed JSON into a valid current-version save, or null if
 * it can't be used. Repairs what it safely can: an unknown room falls back to
 * `world.startRoom`, unknown rooms are dropped from `visited`, and bad counts
 * fall back to defaults.
 *
 * `world` is { roomIds: Set, startRoom, defaultMaxHp }.
 */
export function validateSave(data, world, migrations = MIGRATIONS) {
  if (!isObject(data) || !Number.isInteger(data.version) || data.version < 1) return null
  const save = migrateSave(data, migrations)
  if (!save) return null

  const roomId = world.roomIds.has(save.roomId) ? save.roomId : world.startRoom
  const visited = Array.isArray(save.visited) ? save.visited.filter((id) => world.roomIds.has(id)) : []
  if (!visited.includes(roomId)) visited.push(roomId)
  const strings = (list) => (Array.isArray(list) ? [...new Set(list.filter((a) => typeof a === 'string'))] : [])

  return {
    version: SAVE_VERSION,
    roomId,
    essence: toCount(save.essence, 0),
    maxHp: toCount(save.maxHp, world.defaultMaxHp) || world.defaultMaxHp,
    visited: [...new Set(visited)],
    abilities: strings(save.abilities),
    flags: strings(save.flags),
    savedAt: toCount(save.savedAt, 0),
  }
}

/** Builds a save of the current version. */
export function createSave({ roomId, essence, maxHp, visited, abilities = [], flags = [], savedAt }) {
  return {
    version: SAVE_VERSION,
    roomId,
    essence,
    maxHp,
    visited: [...visited],
    abilities: [...abilities],
    flags: [...flags],
    savedAt,
  }
}
