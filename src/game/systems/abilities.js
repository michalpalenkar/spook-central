import { TILE } from '../levels/parseRoom.js'

// The three abilities that gate the world, and what each one opens:
// - PKE Meter (the Librarian's reward): spectral walls turn out to be
//   illusions, and weak floors show their cracks so the player can stomp
//   through them.
// - Ecto-Dash (captured from Slimer): a short dash that passes through
//   ectoplasm barriers.
// - Slime Boots (sold at the firehouse): cling to slimed walls and wall-jump.

export const ABILITY = {
  PKE: 'pke-meter',
  DASH: 'ecto-dash',
  BOOTS: 'slime-boots',
}

export const ABILITY_IDS = Object.values(ABILITY)

export const ABILITY_INFO = {
  [ABILITY.PKE]: { name: 'PKE Meter', blurb: 'Spectral walls fade · weak floors show their cracks' },
  [ABILITY.DASH]: { name: 'Ecto-Dash', blurb: 'Dash through ectoplasm barriers' },
  [ABILITY.BOOTS]: { name: 'Slime Boots', blurb: 'Cling to slimed walls and wall-jump' },
}

/** Session flags for one-off events, kept in the save. */
export const FLAG = {
  LIBRARIAN_DEFEATED: 'librarian-defeated',
  SLIMER_CAPTURED: 'slimer-captured',
  MALLOW_DEFEATED: 'mallow-defeated',
  BATTERY_CELL_BOUGHT: 'shop-battery-cell',
}

export const FLAG_IDS = Object.values(FLAG)

export function hasAbility(abilities, id) {
  return abilities.has(id)
}

/** Adds an ability to the session. Returns whether it was new. */
export function grantAbility(session, id) {
  if (!ABILITY_IDS.includes(id) || session.abilities.has(id)) return false
  session.abilities.add(id)
  return true
}

export const tileKey = (x, y) => `${x},${y}`

/**
 * The room's tiles as the player meets them: with the PKE Meter spectral
 * walls are gone, and weak floors broken this session (`broken`, a Set of
 * tileKey) are empty. Returns a new grid; the parsed room is never changed.
 */
export function effectiveTiles(tiles, abilities, broken = new Set()) {
  const pke = abilities.has(ABILITY.PKE)
  return tiles.map((row, y) =>
    row.map((tile, x) => {
      if (tile === TILE.SPECTRAL && pke) return TILE.EMPTY
      if (tile === TILE.WEAK_FLOOR && broken.has(tileKey(x, y))) return TILE.EMPTY
      return tile
    }),
  )
}

/** Every tile of `type` connected (4-way) to (x, y), as [{ x, y }]. */
export function connectedTiles(tiles, x, y, type) {
  if (tiles[y]?.[x] !== type) return []
  const seen = new Set([tileKey(x, y)])
  const queue = [{ x, y }]
  const group = []
  while (queue.length) {
    const cell = queue.shift()
    group.push(cell)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cell.x + dx
      const ny = cell.y + dy
      const key = tileKey(nx, ny)
      if (seen.has(key) || tiles[ny]?.[nx] !== type) continue
      seen.add(key)
      queue.push({ x: nx, y: ny })
    }
  }
  return group
}

/**
 * The weak floor tile the player can stomp through, or null: needs the PKE
 * Meter and the player standing on weak floor. `feet` is { left, right, y }
 * in px (the body's bottom edge).
 */
export function weakFloorUnderfoot(tiles, abilities, feet, tileSize) {
  if (!abilities.has(ABILITY.PKE)) return null
  const row = Math.floor((feet.y + 1) / tileSize)
  const first = Math.floor(feet.left / tileSize)
  const last = Math.floor((feet.right - 1) / tileSize)
  for (let x = first; x <= last; x++) {
    if (tiles[row]?.[x] === TILE.WEAK_FLOOR) return { x, y: row }
  }
  return null
}

/**
 * Which side (-1 left, 1 right, 0 none) of a body touches a slimed wall.
 * `rect` is { x, y, width, height } in px; a wall within `reach` px counts.
 */
export function slimeContact(tiles, rect, tileSize, reach = 1) {
  const top = Math.floor(rect.y / tileSize)
  const bottom = Math.floor((rect.y + rect.height - 1) / tileSize)
  const touches = (px) => {
    const column = Math.floor(px / tileSize)
    for (let y = top; y <= bottom; y++) if (tiles[y]?.[column] === TILE.SLIME) return true
    return false
  }
  if (touches(rect.x - reach)) return -1
  if (touches(rect.x + rect.width - 1 + reach)) return 1
  return 0
}

/** Whether a body rect (px) overlaps any ectoplasm barrier tile. */
export function overlapsBarrier(tiles, rect, tileSize) {
  const x0 = Math.floor(rect.x / tileSize)
  const x1 = Math.floor((rect.x + rect.width - 1) / tileSize)
  const y0 = Math.floor(rect.y / tileSize)
  const y1 = Math.floor((rect.y + rect.height - 1) / tileSize)
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (tiles[y]?.[x] === TILE.BARRIER) return true
  }
  return false
}
