import { TILE, isWallTile } from '../levels/parseRoom.js'

/** Empty tiles straight down from (x, y), stopping at anything else. */
function clearanceBelow(tiles, x, y) {
  let n = 0
  while (tiles[y + n]?.[x] === TILE.EMPTY) n++
  return n
}

/**
 * Where hanging lamps go in a room: under ceilings (a wall tile with walls
 * either side and empty space below), above open space at least
 * LAMP_MIN_CLEARANCE tiles tall, at least LAMP_SPACING tiles apart along
 * each ceiling, and at most LAMP_MAX per room (spread evenly; tuning:
 * ATMOSPHERE). Returns
 * [{ x, y, chain }]: the first open tile under the ceiling and the chain
 * length in tiles, chosen from the position so it never changes.
 */
export function lampSpots(tiles, tuning) {
  const { LAMP_SPACING: spacing, LAMP_MIN_CLEARANCE: minClearance, LAMP_MAX: max, LAMP_CHAIN_MIN: chainMin, LAMP_CHAIN_MAX: chainMax } = tuning
  const spots = []
  for (let y = 0; y < tiles.length - 1; y++) {
    let lastX = -Infinity
    for (let x = 1; x < tiles[y].length - 1; x++) {
      const ceiling = isWallTile(tiles[y][x]) && isWallTile(tiles[y][x - 1]) && isWallTile(tiles[y][x + 1])
      if (!ceiling || x - lastX < spacing) continue
      const clearance = clearanceBelow(tiles, x, y + 1)
      if (clearance < minClearance) continue
      const range = chainMax - chainMin + 1
      const chain = Math.min(chainMin + ((x * 7 + y * 3) % range), clearance - minClearance + chainMin)
      spots.push({ x, y: y + 1, chain })
      lastX = x
    }
  }
  if (spots.length <= max) return spots
  const step = spots.length / max
  return Array.from({ length: max }, (_, i) => spots[Math.floor(i * step + step / 2)])
}
