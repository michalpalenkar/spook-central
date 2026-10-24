import Phaser from 'phaser'
import { DEPTH, SHOP, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'

/**
 * The supply desk in the bunk room: a lamp glow and the goods on offer,
 * floating over the desk. Buying is handled by the World scene
 * (systems/shop.js); this class draws it. The player stands at (x, y).
 */
export class ShopDesk {
  constructor(scene, { x, y }) {
    this.x = (x + 0.5) * TILE_SIZE
    this.feetY = (y + 1) * TILE_SIZE
    const displayX = this.x + TILE_SIZE * 2
    const displayY = this.feetY - SHOP.DISPLAY_HEIGHT
    this.glow = scene.add
      .image(displayX, displayY, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.pole.glow))
      .setScale(SHOP.GLOW_SCALE)
      .setAlpha(SHOP.GLOW_ALPHA)
      .setDepth(DEPTH.SHOP)
    this.goods = scene.add.image(displayX, displayY, PROGRESSION_TEXTURES.RELIC, 'slime-boots').setDepth(DEPTH.RELIC)
  }

  /** Shows `item` (from systems/shop.js) on the desk, or nothing when sold out. */
  show(item) {
    this.goods.setVisible(Boolean(item))
    if (item) this.goods.setFrame(item.id)
  }

  flash(scene) {
    scene.tweens.add({ targets: this.glow, alpha: 1, duration: SHOP.FLASH_TIME * 1000, yoyo: true, ease: 'Quad.easeOut' })
  }
}
