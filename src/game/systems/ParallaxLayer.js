import { GAME_HEIGHT, GAME_WIDTH } from '../constants.js'
import { anchoredY, copiesToCover, firstCopyAt } from './parallaxMath.js'

/**
 * One parallax strip (see art/scenery.js for the layer description): copies
 * of its texture laid side by side, scrolled by Phaser scroll factors and
 * shuffled along as the camera moves so they always cover the screen.
 */
export class ParallaxLayer {
  constructor(scene, layer, maxScrollY, { tint = null, alpha = 1, blendMode = null } = {}) {
    this.layer = layer
    this.repeatY = layer.anchor === 'repeat'
    this.y = this.repeatY ? 0 : anchoredY(layer, maxScrollY)
    const cols = copiesToCover(GAME_WIDTH, layer.width)
    const rows = this.repeatY ? copiesToCover(GAME_HEIGHT, layer.height) : 1
    this.copies = []
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const image = scene.add
          .image(0, this.y, layer.key)
          .setOrigin(0)
          .setScrollFactor(layer.factorX, layer.factorY)
          .setDepth(layer.depth)
          .setAlpha(alpha)
        if (tint !== null) image.setTint(tint)
        if (blendMode !== null) image.setBlendMode(blendMode)
        this.copies.push({ image, row, col })
      }
    }
  }

  /** Re-lays the copies for the camera's scroll; `drift` slides the strip sideways. */
  update(camera, drift = 0) {
    const { factorX, factorY, width, height } = this.layer
    const x0 = firstCopyAt(camera.scrollX, factorX, width, drift) - width
    const y0 = this.repeatY ? firstCopyAt(camera.scrollY, factorY, height) - height : this.y
    for (const { image, row, col } of this.copies) image.setPosition(x0 + col * width, y0 + row * height)
  }

  destroy() {
    for (const { image } of this.copies) image.destroy()
  }
}
