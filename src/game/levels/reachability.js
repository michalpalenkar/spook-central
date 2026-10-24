import { PLAYER, PLAYER_MOVES, TILE_SIZE } from '../constants.js'
import { ABILITY } from '../systems/abilities.js'
import { TILE } from './parseRoom.js'
import { matchingExit } from './exits.js'

// A coarse model of where the player can get to, for checking level design
// and ability gating in tests. The player is a column of two tiles (feet and
// head) moving on the tile grid:
// - standing on something, it can walk sideways or start a jump;
// - a jump rises up to JUMP_TILES, straight or diagonally;
// - in the air it falls straight or diagonally (no rising again);
// - with Slime Boots, touching a slimed wall refills the jump (wall jump);
// - with the Ecto-Dash, once per jump it can dash up to DASH_TILES sideways,
//   through ectoplasm barriers;
// - with the PKE Meter, spectral walls are open and weak floors can be
//   stomped through.
// It is a little generous (diagonal falls are steeper in the real game), so
// gaps are checked by playing; what it does catch is a gate that can be
// bypassed, or a route that can't be taken even with the right abilities.

export const JUMP_TILES = Math.floor((PLAYER.JUMP_VELOCITY ** 2 / (2 * PLAYER.GRAVITY)) / TILE_SIZE)
export const DASH_TILES = Math.floor((PLAYER_MOVES.DASH_SPEED * PLAYER_MOVES.DASH_TIME) / TILE_SIZE)

function exitFor(room, x, y) {
  let edge = null
  let along = 0
  if (x < 0) [edge, along] = ['left', y]
  else if (x >= room.width) [edge, along] = ['right', y]
  else if (y < 0) [edge, along] = ['top', x]
  else if (y >= room.height) [edge, along] = ['bottom', x]
  if (!edge) return null
  return room.exits.find((e) => e.edge === edge && along >= e.span[0] && along <= e.span[1]) ?? null
}

function createRules(room, abilities) {
  const pke = abilities.has(ABILITY.PKE)
  const tileAt = (x, y) => room.tiles[y]?.[x]

  // Can a body cell be at (x, y)? Outside the room only through an exit.
  const open = (x, y, dashing = false) => {
    const tile = tileAt(x, y)
    if (tile === undefined) return exitFor(room, x, y) !== null
    if (tile === TILE.EMPTY || tile === TILE.PLATFORM) return true
    if (tile === TILE.SPECTRAL) return pke
    if (tile === TILE.WEAK_FLOOR) return pke && dashing === 'stomp'
    if (tile === TILE.BARRIER) return dashing === true
    return false
  }
  const fits = (x, y, dashing) => open(x, y, dashing) && open(x, y - 1, dashing)
  const ground = (x, y) => {
    const tile = tileAt(x, y + 1)
    if (tile === undefined || tile === TILE.EMPTY) return false
    return !(tile === TILE.SPECTRAL && pke)
  }
  const slimeBeside = (x, y) =>
    [x - 1, x + 1].some((sx) => tileAt(sx, y) === TILE.SLIME || tileAt(sx, y - 1) === TILE.SLIME)
  return { open, fits, ground, slimeBeside, tileAt }
}

/**
 * Explores one room from `starts` ([{ x, y, rise }], feet cells, `rise` the
 * jump left). Returns { cells: Set of "x,y" feet cells reached inside the
 * room, exits: Set of exits taken }.
 */
export function exploreRoom(room, abilities, starts) {
  const rules = createRules(room, abilities)
  const boots = abilities.has(ABILITY.BOOTS)
  const dash = abilities.has(ABILITY.DASH)
  const seen = new Set()
  const cells = new Set()
  const exits = new Set()
  const queue = []

  const push = (x, y, rise, dashReady) => {
    const exit = exitFor(room, x, y) ?? exitFor(room, x, y - 1)
    if (exit && (x < 0 || x >= room.width || y < 0 || y >= room.height || y - 1 < 0)) {
      exits.add(exit)
      return
    }
    const key = `${x},${y},${rise},${dashReady}`
    if (seen.has(key)) return
    seen.add(key)
    queue.push({ x, y, rise, dashReady })
  }
  for (const s of starts) if (rules.fits(s.x, s.y)) push(s.x, s.y, s.rise ?? 0, true)

  while (queue.length) {
    let { x, y, rise, dashReady } = queue.shift()
    cells.add(`${x},${y}`)
    const grounded = rules.ground(x, y)
    if (grounded) {
      rise = JUMP_TILES
      dashReady = true
    } else if (boots && rules.slimeBeside(x, y)) {
      rise = Math.max(rise, JUMP_TILES)
      dashReady = true
    }

    if (grounded) {
      for (const dx of [-1, 1]) if (rules.fits(x + dx, y)) push(x + dx, y, rise, dashReady)
      // Stomping through a weak floor.
      if (rules.tileAt(x, y + 1) === TILE.WEAK_FLOOR && rules.open(x, y + 1, 'stomp')) {
        let fy = y + 1
        while (rules.tileAt(x, fy) === TILE.WEAK_FLOOR) fy++
        if (rules.open(x, fy) || rules.tileAt(x, fy) === undefined) push(x, fy, 0, dashReady)
      }
    }
    if (rise > 0) {
      for (const dx of [-1, 0, 1]) {
        if (!rules.fits(x + dx, y - 1)) continue
        if (dx !== 0 && !(rules.fits(x + dx, y) || rules.fits(x, y - 1))) continue
        push(x + dx, y - 1, rise - 1, dashReady)
      }
    }
    if (!grounded) {
      for (const dx of [-1, 0, 1]) {
        if (!rules.fits(x + dx, y + 1)) continue
        if (dx !== 0 && !(rules.fits(x + dx, y) || rules.fits(x, y + 1))) continue
        push(x + dx, y + 1, 0, dashReady)
      }
    }
    if (dash && dashReady) {
      for (const dir of [-1, 1]) {
        for (let step = 1; step <= DASH_TILES; step++) {
          const nx = x + dir * step
          if (!rules.fits(nx, y, true)) break
          if (rules.fits(nx, y)) push(nx, y, 0, grounded)
        }
      }
    }
  }
  return { cells, exits }
}

/** Feet cells where a player comes in through `exit` of `room` (one of its own exits). */
export function entryCells(room, exit) {
  const [first, last] = exit.span
  const cells = []
  for (let t = first; t <= last; t++) {
    if (exit.edge === 'left') cells.push({ x: 0, y: t, rise: 0 })
    else if (exit.edge === 'right') cells.push({ x: room.width - 1, y: t, rise: 0 })
    else if (exit.edge === 'top') cells.push({ x: t, y: 1, rise: 0 })
    // Coming up through the floor gives a full jump (ROOM_TRANSITION.ENTRY_JUMP_VELOCITY).
    else cells.push({ x: t, y: room.height - 1, rise: JUMP_TILES })
  }
  return cells
}

/**
 * Explores the whole world from feet cells `starts` in room `startId` with a
 * fixed set of abilities. Returns a Map of roomId → Set of "x,y" feet cells
 * reached.
 */
export function exploreWorld(rooms, startId, starts, abilities) {
  const byId = new Map(rooms.map((room) => [room.id, room]))
  const reached = new Map()
  const done = new Set()
  const queue = [{ roomId: startId, starts, key: `${startId}:start` }]
  while (queue.length) {
    const { roomId, starts: from, key } = queue.shift()
    if (done.has(key)) continue
    done.add(key)
    const room = byId.get(roomId)
    const { cells, exits } = exploreRoom(room, abilities, from)
    if (!reached.has(roomId)) reached.set(roomId, new Set())
    for (const cell of cells) reached.get(roomId).add(cell)
    for (const exit of exits) {
      const target = byId.get(exit.to)
      const back = target && matchingExit(room, exit, target)
      if (!back) continue
      queue.push({ roomId: target.id, starts: entryCells(target, back), key: `${target.id}:${back.edge}:${back.span}` })
    }
  }
  return reached
}

/** Whether any reached feet cell lies within `radius` tiles of (x, y). */
export function reachesNear(cells, x, y, radius) {
  if (!cells) return false
  for (const key of cells) {
    const [cx, cy] = key.split(',').map(Number)
    if (Math.abs(cx - x) <= radius && Math.abs(cy - y) <= radius) return true
  }
  return false
}
