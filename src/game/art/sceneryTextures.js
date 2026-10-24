import { GAME_HEIGHT, GAME_WIDTH, SCENERY } from '../constants.js'
import { ROOMS } from '../levels/world.js'
import { paintCommands } from './paintCommands.js'
import { createRng, seedFrom } from './rng.js'
import { backdropKey, sceneryLayers, sceneryPalette, sceneryVariants } from './scenery.js'
import { paintSky, paintStyle } from './sceneryShapes.js'

/**
 * Draws the parallax strips of every scenery variant the world uses, plus
 * the sky backdrop of outdoor variants. Indoor rooms keep the area's
 * gradient backdrop (art/generateTextures.js). Each texture has its own
 * seed, so the scenery looks the same on every run.
 */
export function generateSceneryTextures(scene) {
  for (const variant of sceneryVariants(ROOMS)) {
    const palette = sceneryPalette(variant)
    if (variant.outdoor) {
      const key = backdropKey(variant)
      const rng = createRng(seedFrom(key, SCENERY.SEED))
      paintTexture(scene, key, GAME_WIDTH, GAME_HEIGHT, paintSky({ width: GAME_WIDTH, height: GAME_HEIGHT, palette, rng }), false)
    }
    for (const layer of sceneryLayers(variant)) {
      const rng = createRng(seedFrom(layer.key, SCENERY.SEED))
      const commands = paintStyle(layer.style, { width: layer.width, height: layer.height, palette, rng })
      paintTexture(scene, layer.key, layer.width, layer.height, commands, layer.anchor === 'repeat')
    }
  }
}

function paintTexture(scene, key, width, height, commands, wrapY) {
  const texture = scene.textures.createCanvas(key, width, height)
  paintCommands(texture.context, commands, { width, height, wrapY })
  texture.refresh()
}
