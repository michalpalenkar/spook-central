import Phaser from 'phaser'
import { DEPTH, RELIC } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'

/**
 * An ability left behind by a captured boss: a glowing relic that bobs
 * above the floor until the player walks into it.
 */
export class Relic {
  constructor(scene, ability, x, floorY) {
    this.ability = ability
    this.x = x
    this.baseY = floorY - RELIC.HOVER_HEIGHT
    this.time = 0
    this.collected = false
    this.glow = scene.add
      .image(x, this.baseY, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.relic.glow))
      .setScale(RELIC.GLOW_SCALE)
      .setAlpha(RELIC.GLOW_ALPHA)
      .setDepth(DEPTH.RELIC)
    this.sprite = scene.add.image(x, this.baseY, PROGRESSION_TEXTURES.RELIC, ability).setDepth(DEPTH.RELIC)
  }

  /** Returns true on the frame the player picks it up. */
  update(dt, player) {
    if (this.collected) return false
    this.time += dt
    const y = this.baseY + Math.sin(this.time * RELIC.BOB_SPEED) * RELIC.BOB_AMPLITUDE
    this.sprite.setY(y)
    this.glow.setY(y).setAlpha(RELIC.GLOW_ALPHA * (0.8 + 0.2 * Math.sin(this.time * RELIC.BOB_SPEED * 2)))
    if (this.time < RELIC.PICKUP_DELAY || Math.hypot(player.x - this.x, player.y - y) > RELIC.PICKUP_RADIUS) return false
    this.collected = true
    this.sprite.destroy()
    this.glow.destroy()
    return true
  }
}
