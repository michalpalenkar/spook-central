import { TILE_SIZE } from '../constants.js'
import { BARRIER_FRAME, PLATFORM_FRAME, SKY_FRAME, SLIME_FRAME_START, SOLID_FRAME_COUNT, tileIndexAt, toTileIndices } from '../levels/autotile.js'
import { canLandOnPlatform } from './oneWayPlatform.js'

/**
 * Builds a collidable tilemap layer from a tile grid (a room's tiles as the
 * player meets them; see systems/abilities.js effectiveTiles), using the
 * tileset texture `tilesKey`.
 */
export function buildRoom(scene, tiles, tilesKey) {
  const map = scene.make.tilemap({
    data: toTileIndices(tiles),
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  })
  const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE_SIZE, TILE_SIZE, 0, 0)
  const layer = map.createLayer(0, tileset, 0, 0)

  // Solid faces are computed first, while platforms don't collide, so walls
  // next to a platform keep their side faces.
  layer.setCollisionBetween(0, SOLID_FRAME_COUNT - 1)
  layer.setCollisionBetween(SLIME_FRAME_START, SKY_FRAME)
  layer.forEachTile((tile) => {
    if (tile.index !== PLATFORM_FRAME) return
    tile.setCollision(false, false, true, false, false)
    tile.faceTop = true
  })

  return {
    layer,
    width: map.widthInPixels,
    height: map.heightInPixels,
  }
}

/**
 * Clears tiles from a built layer (a weak floor stomped through) and redraws
 * their neighbours so newly exposed edges get their highlight. `tiles` is the
 * grid the layer was built from, already updated.
 */
export function clearTiles(layer, tiles, cells) {
  const touched = new Set()
  for (const { x, y } of cells) {
    layer.removeTileAt(x, y)
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) touched.add(`${x + dx},${y + dy}`)
  }
  for (const key of touched) {
    const [x, y] = key.split(',').map(Number)
    if (!tiles[y] || tiles[y][x] === undefined) continue
    const index = tileIndexAt(tiles, x, y)
    if (index >= 0) layer.putTileAt(index, x, y)
  }
}

/**
 * Process callback for a body-vs-room collider: platforms are one-way, and
 * ectoplasm barriers let a body through while it is dashing
 * (`object.passesBarriers`).
 */
export function roomCollisionFilter(object, tile) {
  if (tile.index === BARRIER_FRAME) return !object.passesBarriers
  if (tile.index !== PLATFORM_FRAME) return true
  const { body } = object
  return canLandOnPlatform(body.prev.y + body.height, tile.getTop(), body.velocity.y)
}
