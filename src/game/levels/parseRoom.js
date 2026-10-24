export const TILE = {
  EMPTY: 0,
  SOLID: 1,
  PLATFORM: 2,
}

const LEGEND = {
  '.': TILE.EMPTY,
  '#': TILE.SOLID,
  '=': TILE.PLATFORM,
}

const SPAWN_MARKER = 'P'

/**
 * Turns a room definition into a tile grid:
 * { id, grid: string[], entities?, exits?, area?, name?, origin? }.
 *
 * `P` in the grid marks the new-game player spawn and is stored as empty; a
 * room has at most one (most have none). `origin` is the room's top-left
 * corner in world tiles, which places it on the area map and lines up exits
 * between neighbouring rooms.
 */
export function parseRoom({ id, grid, entities = [], exits = [], area = null, name = id, origin = { x: 0, y: 0 } }) {
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
    width,
    height: grid.length,
    tiles,
    spawn: spawns[0] ?? null,
    entities,
    exits,
  }
}
