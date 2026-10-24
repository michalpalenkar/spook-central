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
 * Turns a room definition ({ id, grid: string[], entities?, exits? }) into
 * a tile grid. `P` in the grid marks the player spawn and is stored as empty.
 */
export function parseRoom({ id, grid, entities = [], exits = [] }) {
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

  if (spawns.length !== 1) {
    throw new Error(`Room "${id}" needs exactly one spawn "${SPAWN_MARKER}", found ${spawns.length}`)
  }

  return { id, width, height: grid.length, tiles, spawn: spawns[0], entities, exits }
}
