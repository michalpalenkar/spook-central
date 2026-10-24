import Phaser from 'phaser'
import { DEPTH, ESSENCE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { approach } from '../systems/movement.js'
import { isSolidAt } from '../systems/lineOfSight.js'

const DEG_TO_RAD = Math.PI / 180

/**
 * A blob of ecto-essence dropped by a captured ghost. It pops out, bounces
 * on the floor, then homes in on the player once they come close.
 */
export class EssenceOrb {
  constructor(scene, x, y, tiles) {
    this.tiles = tiles
    this.x = x
    this.y = y
    const angle = (Phaser.Math.FloatBetween(-ESSENCE.ORB_SPREAD, ESSENCE.ORB_SPREAD) - 90) * DEG_TO_RAD
    const speed = Phaser.Math.FloatBetween(ESSENCE.ORB_SPEED_MIN, ESSENCE.ORB_SPEED_MAX)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.age = 0
    this.collected = false

    this.glow = scene.add
      .image(x, y, COMBAT_TEXTURES.GLOW)
      .setDepth(DEPTH.ORB)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.essence.glow))
      .setScale(ESSENCE.ORB_GLOW_SCALE)
    this.sprite = scene.add.image(x, y, COMBAT_TEXTURES.ORB).setDepth(DEPTH.ORB)
  }

  /** Returns true on the frame the player picks it up. */
  update(dt, playerX, playerY) {
    this.age += dt
    const dx = playerX - this.x
    const dy = playerY - this.y
    const distance = Math.hypot(dx, dy)
    const canPickUp = this.age >= ESSENCE.ORB_PICKUP_DELAY

    if (canPickUp && distance <= ESSENCE.ORB_PICKUP_RADIUS) {
      this.destroy()
      this.collected = true
      return true
    }

    if (canPickUp && distance <= ESSENCE.ORB_MAGNET_RANGE) {
      // Homing ignores walls; it only happens at close range.
      this.vx = (dx / distance) * ESSENCE.ORB_MAGNET_SPEED
      this.vy = (dy / distance) * ESSENCE.ORB_MAGNET_SPEED
      this.x += this.vx * dt
      this.y += this.vy * dt
    } else {
      this.fall(dt)
    }

    const twinkle = 1 + Math.sin(this.age * ESSENCE.ORB_TWINKLE_SPEED) * ESSENCE.ORB_TWINKLE_AMOUNT
    this.sprite.setPosition(this.x, this.y)
    this.glow.setPosition(this.x, this.y).setAlpha(ESSENCE.ORB_GLOW_ALPHA * twinkle)
    return false
  }

  fall(dt) {
    const r = ESSENCE.ORB_SIZE / 2
    this.vy += ESSENCE.ORB_GRAVITY * dt
    this.vx = approach(this.vx, 0, ESSENCE.ORB_DRAG * dt)

    const nextX = this.x + this.vx * dt
    if (isSolidAt(this.tiles, nextX + Math.sign(this.vx) * r, this.y)) this.vx *= -ESSENCE.ORB_BOUNCE
    else this.x = nextX

    const nextY = this.y + this.vy * dt
    const edgeY = nextY + Math.sign(this.vy) * r
    if (isSolidAt(this.tiles, this.x, edgeY)) {
      const landing = this.vy > 0
      this.vy = Math.abs(this.vy) < ESSENCE.ORB_REST_SPEED && landing ? 0 : this.vy * -ESSENCE.ORB_BOUNCE
    } else {
      this.y = nextY
    }
  }

  destroy() {
    this.sprite.destroy()
    this.glow.destroy()
  }
}
