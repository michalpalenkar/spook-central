import { createWallet } from './essence.js'
import { createSave } from './saveFormat.js'

// Everything about a play session that outlives a single room: the World
// scene restarts for every room and reads its starting state from here.
//
// - `entry` says where the player appears in `roomId`: at the room's new-game
//   spawn, at its fire pole, or where an exit put them ({ x, y, vx, vy }).
// - `respawn` is the last save point. Dying sends the player back there with
//   the essence they had when they saved.
// - `captured` holds ghosts caught since the last rest ("roomId/ghostId");
//   they stay gone until the player rests or dies, then every ghost returns.
// - `abilities` and `flags` (bosses beaten, goods bought) are never lost;
//   gaining one writes a checkpoint save at once (checkpointSave).
// - `broken` holds weak floors stomped through this session ("roomId/x,y").
// - `chase` is Slimer's progress through the hotel (systems/slimerChase.js).

export const ENTRY = {
  SPAWN: 'spawn',
  POLE: 'pole',
  EXIT: 'exit',
}

function baseSession({ roomId, entry, maxHp, essence, visited, abilities, flags }) {
  const wallet = createWallet()
  wallet.essence = essence
  return {
    roomId,
    entry,
    hp: maxHp,
    maxHp,
    wallet,
    visited: new Set([...visited, roomId]),
    abilities: new Set(abilities),
    flags: new Set(flags),
    respawn: { roomId, entry: entry.type, essence },
    captured: new Set(),
    broken: new Set(),
    chase: { stage: 0 },
  }
}

/** A fresh game in the world's start room. `world` is { startRoom, defaultMaxHp }. */
export function newSession(world) {
  return baseSession({
    roomId: world.startRoom,
    entry: { type: ENTRY.SPAWN },
    maxHp: world.defaultMaxHp,
    essence: 0,
    visited: [],
    abilities: [],
    flags: [],
  })
}

/** A session continued from a validated save, at the fire pole it was made at. */
export function sessionFromSave(save) {
  return baseSession({
    roomId: save.roomId,
    entry: { type: ENTRY.POLE },
    maxHp: save.maxHp,
    essence: save.essence,
    visited: save.visited,
    abilities: save.abilities,
    flags: save.flags ?? [],
  })
}

/** Marks a room as visited. Returns whether it was new. */
export function visitRoom(session, roomId) {
  if (session.visited.has(roomId)) return false
  session.visited.add(roomId)
  return true
}

/** Moves the session to another room through an exit, carrying the player's HP. */
export function travel(session, roomId, placement, hp) {
  session.roomId = roomId
  session.entry = { type: ENTRY.EXIT, ...placement }
  session.hp = hp
  visitRoom(session, roomId)
}

const ghostKey = (roomId, ghostId) => `${roomId}/${ghostId}`

export function markCaptured(session, roomId, ghostId) {
  session.captured.add(ghostKey(roomId, ghostId))
}

export function isCaptured(session, roomId, ghostId) {
  return session.captured.has(ghostKey(roomId, ghostId))
}

/**
 * Rests at the fire pole in `roomId`: full HP, every ghost back, and this
 * pole becomes the respawn point. Returns the save to write.
 */
export function restAtPole(session, roomId, savedAt) {
  session.hp = session.maxHp
  session.captured.clear()
  session.respawn = { roomId, entry: ENTRY.POLE, essence: session.wallet.essence }
  return createSave({
    roomId,
    essence: session.wallet.essence,
    maxHp: session.maxHp,
    visited: session.visited,
    abilities: session.abilities,
    flags: session.flags,
    savedAt,
  })
}

/**
 * A save written when the player gains something permanent (an ability, a
 * boss beaten, goods bought) away from a fire pole: it keeps the last pole
 * and the essence held there, plus everything gained since. Returns the save.
 */
export function checkpointSave(session, savedAt) {
  return createSave({
    roomId: session.respawn.roomId,
    essence: session.respawn.essence,
    maxHp: session.maxHp,
    visited: session.visited,
    abilities: session.abilities,
    flags: session.flags,
    savedAt,
  })
}

const tileKey = (roomId, x, y) => `${roomId}/${x},${y}`

export function markBroken(session, roomId, cells) {
  for (const { x, y } of cells) session.broken.add(tileKey(roomId, x, y))
}

/** Weak floors broken in `roomId`, as a Set of "x,y". */
export function brokenIn(session, roomId) {
  const prefix = `${roomId}/`
  return new Set([...session.broken].filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length)))
}

/**
 * After death: back to the last save point with full HP and the essence
 * held when saving. Rooms seen since then stay on the map.
 */
export function respawnAtSave(session) {
  const { roomId, entry, essence } = session.respawn
  session.roomId = roomId
  session.entry = { type: entry }
  session.hp = session.maxHp
  session.wallet = createWallet()
  session.wallet.essence = essence
  session.captured.clear()
}
