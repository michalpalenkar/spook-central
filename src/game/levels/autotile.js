import { TILE } from './parseRoom.js'

// Bits set for each side of a solid tile that faces open space.
export const EDGE = {
  TOP: 1,
  RIGHT: 2,
  BOTTOM: 4,
  LEFT: 8,
}

// Tileset layout: frames 0–15 are solid tiles indexed by edge mask, then the platform.
export const SOLID_FRAME_COUNT = 16
export const PLATFORM_FRAME = 16
export const EMPTY_INDEX = -1

// Outside the room counts as solid so the room's border has no exposed edges.
export function isSolidAt(tiles, x, y) {
  if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[y].length) return true
  return tiles[y][x] === TILE.SOLID
}

export function edgeMask(tiles, x, y) {
  let mask = 0
  if (!isSolidAt(tiles, x, y - 1)) mask |= EDGE.TOP
  if (!isSolidAt(tiles, x + 1, y)) mask |= EDGE.RIGHT
  if (!isSolidAt(tiles, x, y + 1)) mask |= EDGE.BOTTOM
  if (!isSolidAt(tiles, x - 1, y)) mask |= EDGE.LEFT
  return mask
}

/** Maps a parsed tile grid to tileset frame indices for a Phaser tilemap. */
export function toTileIndices(tiles) {
  return tiles.map((row, y) =>
    row.map((tile, x) => {
      if (tile === TILE.SOLID) return edgeMask(tiles, x, y)
      if (tile === TILE.PLATFORM) return PLATFORM_FRAME
      return EMPTY_INDEX
    }),
  )
}
