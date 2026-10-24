import { DEPTH, GAME_HEIGHT } from '../constants.js'
import { areaTextures } from '../art/generateTextures.js'
import { backdropKey, sceneryLayers, sceneryVariant } from '../art/scenery.js'
import { ParallaxLayer } from './ParallaxLayer.js'

/**
 * A room's backdrop and parallax layers: the area's gradient (or the sky,
 * outdoors) fixed to the screen, far and mid layers behind the room and dark
 * foreground shapes in front of it (art/scenery.js).
 */
export class Scenery {
  constructor(scene, room, roomHeight) {
    this.variant = sceneryVariant(room)
    const backdrop = this.variant.outdoor ? backdropKey(this.variant) : areaTextures(this.variant.area).backdrop
    this.backdrop = scene.add.image(0, 0, backdrop).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.BACKDROP)
    const maxScrollY = Math.max(0, roomHeight - GAME_HEIGHT)
    this.layers = sceneryLayers(this.variant).map((layer) => new ParallaxLayer(scene, layer, maxScrollY))
  }

  update(camera) {
    for (const layer of this.layers) layer.update(camera)
  }
}
