export const TILE = {
  EMPTY: 0,
  SOLID: 1,
  PLATFORM: 2,
  // Gates (see systems/abilities.js). A spectral wall looks and acts like
  // brick until the PKE Meter reveals it as an illusion; a weak floor holds
  // until the PKE Meter shows its cracks and the player stomps through it.
  SPECTRAL: 3,
  WEAK_FLOOR: 4,
  // Ectoplasm barrier: solid, except to an Ecto-Dash.
  BARRIER: 5,
  // Slimed wall: solid; Slime Boots cling to it.
  SLIME: 6,
  // Open sky over an outdoor room: solid like the room's border, but never
  // drawn and not masonry, so the walls beneath it read as rooftops.
  SKY: 7,
}

const LEGEND = {
  '.': TILE.EMPTY,
  '#': TILE.SOLID,
  '=': TILE.PLATFORM,
  H: TILE.SPECTRAL,
  B: TILE.WEAK_FLOOR,
  E: TILE.BARRIER,
  S: TILE.SLIME,
  '^': TILE.SKY,
}

const WALLS = new Set([TILE.SOLID, TILE.SPECTRAL, TILE.WEAK_FLOOR, TILE.SLIME])

/**
 * Whether a tile is masonry: drawn and treated as wall by line of sight,
 * floors and the map. Barriers and platforms are not walls.
 */
export function isWallTile(tile) {
  return WALLS.has(tile)
}

/** Whether a tile blocks the player: walls, the sky boundary and barriers. */
export function isClosedTile(tile) {
  return WALLS.has(tile) || tile === TILE.SKY
}

const SPAWN_MARKER = 'P'

/**
 * Turns a room definition into a tile grid (legend above; `P` is the spawn):
 * { id, grid: string[], entities?, exits?, area?, name?, origin?, outdoor? }.
 *
 * `P` in the grid marks the new-game player spawn and is stored as empty; a
 * room has at most one (most have none). `origin` is the room's top-left
 * corner in world tiles, which places it on the area map and lines up exits
 * between neighbouring rooms. `outdoor` rooms are drawn against the sky and
 * the skyline instead of interior architecture.
 */
export function parseRoom({ id, grid, entities = [], exits = [], area = null, name = id, origin = { x: 0, y: 0 }, outdoor = false }) {
  if (!grid?.length) throw new Error(`Room "${id}" has no rows`)

  const width = grid[0].length
  const spawns = []
  const tiles = grid.map((row, y) => {
    if (row.length !== width) {
      throw new Error(`Room "${id}": row ${y} is ${row.length} wide, expected ${width}`)
    }
    return [...row].map((char, x) => {
      if (char === SPAWN_MARKER) {
        spawns.push({ x, y })
        return TILE.EMPTY
      }
      const tile = LEGEND[char]
      if (tile === undefined) throw new Error(`Room "${id}": unknown tile "${char}" at ${x},${y}`)
      return tile
    })
  })

  if (spawns.length > 1) {
    throw new Error(`Room "${id}" has ${spawns.length} spawns "${SPAWN_MARKER}", expected at most one`)
  }

  return {
    id,
    name,
    area,
    origin,
    outdoor,
    width,
    height: grid.length,
    tiles,
    spawn: spawns[0] ?? null,
    entities,
    exits,
  }
}
