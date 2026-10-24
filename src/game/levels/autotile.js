import { TILE, isWallTile } from './parseRoom.js'

// Bits set for each side of a solid tile that faces open space.
export const EDGE = {
  TOP: 1,
  RIGHT: 2,
  BOTTOM: 4,
  LEFT: 8,
}

// Tileset layout: frames 0–15 are solid tiles indexed by edge mask, then the
// platform, then 16 slimed walls (same masks), then the ectoplasm barrier.
export const SOLID_FRAME_COUNT = 16
export const PLATFORM_FRAME = 16
export const SLIME_FRAME_START = 17
export const BARRIER_FRAME = SLIME_FRAME_START + SOLID_FRAME_COUNT
export const TILESET_FRAME_COUNT = BARRIER_FRAME + 1
export const EMPTY_INDEX = -1

export const isSlimeFrame = (index) => index >= SLIME_FRAME_START && index < BARRIER_FRAME

// Outside the room counts as solid so the room's border has no exposed edges.
// Every kind of wall (spectral, weak, slimed) joins up with brick.
export function isSolidAt(tiles, x, y) {
  if (y < 0 || y >= tiles.length || x < 0 || x >= tiles[y].length) return true
  return isWallTile(tiles[y][x])
}

export function edgeMask(tiles, x, y) {
  let mask = 0
  if (!isSolidAt(tiles, x, y - 1)) mask |= EDGE.TOP
  if (!isSolidAt(tiles, x + 1, y)) mask |= EDGE.RIGHT
  if (!isSolidAt(tiles, x, y + 1)) mask |= EDGE.BOTTOM
  if (!isSolidAt(tiles, x - 1, y)) mask |= EDGE.LEFT
  return mask
}

/** The tileset frame for the tile at (x, y). Spectral walls and weak floors pass for brick. */
export function tileIndexAt(tiles, x, y) {
  const tile = tiles[y][x]
  if (tile === TILE.SLIME) return SLIME_FRAME_START + edgeMask(tiles, x, y)
  if (isWallTile(tile)) return edgeMask(tiles, x, y)
  if (tile === TILE.PLATFORM) return PLATFORM_FRAME
  if (tile === TILE.BARRIER) return BARRIER_FRAME
  return EMPTY_INDEX
}

/** Maps a parsed tile grid to tileset frame indices for a Phaser tilemap. */
export function toTileIndices(tiles) {
  return tiles.map((row, y) => row.map((_tile, x) => tileIndexAt(tiles, x, y)))
}
