import { TILE_SIZE } from '../constants.js'
import { PLATFORM_FRAME, SOLID_FRAME_COUNT, toTileIndices } from '../levels/autotile.js'
import { canLandOnPlatform } from './oneWayPlatform.js'

/** Builds a collidable tilemap layer from a parsed room, using the tileset texture `tilesKey`. */
export function buildRoom(scene, room, tilesKey) {
  const map = scene.make.tilemap({
    data: toTileIndices(room.tiles),
    tileWidth: TILE_SIZE,
    tileHeight: TILE_SIZE,
  })
  const tileset = map.addTilesetImage(tilesKey, tilesKey, TILE_SIZE, TILE_SIZE, 0, 0)
  const layer = map.createLayer(0, tileset, 0, 0)

  // Solid faces are computed first, while platforms don't collide, so walls
  // next to a platform keep their side faces.
  layer.setCollisionBetween(0, SOLID_FRAME_COUNT - 1)
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

/** Process callback for a body-vs-room collider that makes platforms one-way. */
export function roomCollisionFilter(object, tile) {
  if (tile.index !== PLATFORM_FRAME) return true
  const { body } = object
  return canLandOnPlatform(body.prev.y + body.height, tile.getTop(), body.velocity.y)
}
