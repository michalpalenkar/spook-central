import { TILE_SIZE } from '../constants.js'
import { TILE } from '../levels/parseRoom.js'

export function isSolidAt(tiles, x, y, tileSize = TILE_SIZE) {
  const row = tiles[Math.floor(y / tileSize)]
  if (!row) return true
  const tile = row[Math.floor(x / tileSize)]
  return tile === undefined || tile === TILE.SOLID
}

/**
 * Walks from (x0, y0) toward (x1, y1) in `step` px increments and returns
 * the last point before a solid tile, plus whether a wall was hit. One-way
 * platforms don't block.
 */
export function castRay(tiles, x0, y0, x1, y1, step, tileSize = TILE_SIZE) {
  const dx = x1 - x0
  const dy = y1 - y0
  const length = Math.hypot(dx, dy)
  if (length === 0) return { x: x0, y: y0, blocked: isSolidAt(tiles, x0, y0, tileSize) }
  const count = Math.ceil(length / step)
  let last = { x: x0, y: y0 }
  for (let i = 1; i <= count; i++) {
    const t = Math.min(1, (i * step) / length)
    const point = { x: x0 + dx * t, y: y0 + dy * t }
    if (isSolidAt(tiles, point.x, point.y, tileSize)) return { ...last, blocked: true }
    last = point
  }
  return { ...last, blocked: false }
}

/**
 * The y of the top of the first solid tile at or below (x, y), or null when
 * (x, y) is inside a wall or there is no floor below.
 */
export function groundBelow(tiles, x, y, tileSize = TILE_SIZE) {
  if (isSolidAt(tiles, x, y, tileSize)) return null
  const column = Math.floor(x / tileSize)
  for (let row = Math.floor(y / tileSize) + 1; row < tiles.length; row++) {
    if (tiles[row][column] === TILE.SOLID) return row * tileSize
  }
  return null
}

export function hasLineOfSight(tiles, x0, y0, x1, y1, step, tileSize = TILE_SIZE) {
  return !castRay(tiles, x0, y0, x1, y1, step, tileSize).blocked
}
