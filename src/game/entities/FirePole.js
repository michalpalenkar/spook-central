import Phaser from 'phaser'
import { DEPTH, FIRE_POLE, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { TEXTURES } from '../art/generateTextures.js'
import { PALETTE } from '../art/palette.js'
import { TILE } from '../levels/parseRoom.js'

/**
 * The firehouse pole, the save point. It runs from the floor tile at
 * (`x`, `y`) up to the first solid tile above. Resting at it is handled by
 * the World scene; this class draws it and its glow.
 */
export class FirePole {
  constructor(scene, { x, y }, room) {
    let top = y
    while (top > 0 && room.tiles[top - 1][x] !== TILE.SOLID && room.tiles[top - 1][x] !== TILE.SKY) top--

    this.x = (x + 0.5) * TILE_SIZE
    this.feetY = (y + 1) * TILE_SIZE
    const topY = top * TILE_SIZE
    const height = this.feetY - topY

    this.rod = scene.add
      .tileSprite(this.x, topY, FIRE_POLE.WIDTH, height, TEXTURES.POLE)
      .setOrigin(0.5, 0)
      .setDepth(DEPTH.POLE)
    this.glow = scene.add
      .image(this.x, this.feetY - TILE_SIZE, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.pole.glow))
      .setScale(FIRE_POLE.GLOW_SCALE)
      .setAlpha(FIRE_POLE.GLOW_ALPHA)
      .setDepth(DEPTH.POLE)
    this.scene = scene
  }

  /** A warm flash when the player rests here. */
  flash() {
    this.scene.tweens.killTweensOf(this.glow)
    this.glow.setScale(FIRE_POLE.SAVE_GLOW_SCALE).setAlpha(FIRE_POLE.SAVE_GLOW_ALPHA)
    this.scene.tweens.add({
      targets: this.glow,
      scale: FIRE_POLE.GLOW_SCALE,
      alpha: FIRE_POLE.GLOW_ALPHA,
      duration: FIRE_POLE.SAVE_GLOW_TIME * 1000,
      ease: 'Quad.easeOut',
    })
  }
}
