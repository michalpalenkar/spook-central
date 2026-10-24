import Phaser from 'phaser'
import { ATMOSPHERE, DEPTH, TILE_SIZE } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { lampSize } from '../art/lampFrames.js'

/**
 * A lamp hanging from the ceiling on a chain (systems/lampSpots.js), swaying
 * a little, with a soft additive glow and a cone of light beneath it.
 * Decoration only: it doesn't collide.
 */
export class Lamp {
  constructor(scene, { x, y, chain }, area, palette) {
    this.anchorX = (x + 0.5) * TILE_SIZE
    this.anchorY = y * TILE_SIZE
    this.length = chain * TILE_SIZE
    this.height = lampSize(area).height
    this.time = x * ATMOSPHERE.LAMP_PHASE_PER_TILE
    const metal = toColor(palette.mid)
    const light = toColor(palette.lamp)

    this.chain = scene.add
      .image(this.anchorX, this.anchorY, ATMOSPHERE_TEXTURES.PIXEL)
      .setOrigin(0.5, 0)
      .setScale(1, this.length)
      .setTint(metal)
      .setDepth(DEPTH.LAMP)
    this.lamp = scene.add.image(0, 0, ATMOSPHERE_TEXTURES.LAMP, area).setOrigin(0.5, 0).setDepth(DEPTH.LAMP)
    this.cone = scene.add
      .image(0, 0, ATMOSPHERE_TEXTURES.CONE)
      .setOrigin(0.5, 0)
      .setTint(light)
      .setAlpha(ATMOSPHERE.CONE_ALPHA)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.LIGHT)
    this.glow = scene.add
      .image(0, 0, ATMOSPHERE_TEXTURES.LIGHT)
      .setTint(light)
      .setScale(ATMOSPHERE.LIGHT_SCALE)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.LIGHT)
    this.update(0)
  }

  update(dt) {
    this.time += dt
    const angle = Math.sin(this.time * ATMOSPHERE.LAMP_SWAY_SPEED) * ATMOSPHERE.LAMP_SWAY
    const x = this.anchorX + Math.sin(angle) * this.length
    const y = this.anchorY + Math.cos(angle) * this.length
    this.chain.setRotation(-angle)
    this.lamp.setPosition(x, y).setRotation(-angle)
    const flicker = 1 + Math.sin(this.time * ATMOSPHERE.LIGHT_FLICKER_SPEED_A) * Math.sin(this.time * ATMOSPHERE.LIGHT_FLICKER_SPEED_B) * ATMOSPHERE.LIGHT_FLICKER
    const bulbY = y + this.height - 1
    this.glow.setPosition(x, bulbY).setAlpha(ATMOSPHERE.LIGHT_ALPHA * flicker)
    this.cone.setPosition(x, bulbY).setRotation(-angle)
  }
}
