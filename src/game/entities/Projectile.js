import Phaser from 'phaser'
import { DEPTH, PROJECTILE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_ANIMS, PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { circleIntersectsRect } from '../systems/overlap.js'
import { PROJECTILE_KIND, createProjectile, stepProjectile } from '../systems/projectile.js'

const SHOCKWAVE_WIDTH = 14

/**
 * A boss projectile: a spinning book, a marshmallow glob or a stomp
 * shockwave. Motion and hits are in systems/projectile.js.
 */
export class Projectile {
  constructor(scene, kind, x, y, vx, vy, tiles) {
    this.scene = scene
    this.tiles = tiles
    this.p = createProjectile(kind, x, y, vx, vy)

    const glowColor = kind === PROJECTILE_KIND.BOOK ? PALETTE.librarian.glow : PALETTE.projectiles.shockwave
    this.glow = scene.add
      .image(x, y, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(glowColor))
      .setScale(PROJECTILE.GLOW_SCALE)
      .setAlpha(PROJECTILE.GLOW_ALPHA)
      .setDepth(DEPTH.PROJECTILE)
    if (kind === PROJECTILE_KIND.BOOK) {
      this.sprite = scene.add.sprite(x, y, PROGRESSION_TEXTURES.BOOK, 'book0').setDepth(DEPTH.PROJECTILE)
      this.sprite.play(PROGRESSION_ANIMS.BOOK_SPIN)
    } else if (kind === PROJECTILE_KIND.GLOB) {
      this.sprite = scene.add.image(x, y, PROGRESSION_TEXTURES.GLOB).setDepth(DEPTH.PROJECTILE)
    } else {
      // A low crest of light running along the floor.
      this.sprite = scene.add
        .ellipse(x, y, SHOCKWAVE_WIDTH, PROJECTILE.SHOCKWAVE_HEIGHT * 2, toColor(PALETTE.projectiles.shockwave), 0.8)
        .setDepth(DEPTH.PROJECTILE)
        .setBlendMode(Phaser.BlendModes.ADD)
    }
  }

  get dead() {
    return this.p.dead
  }

  touches(rect) {
    return circleIntersectsRect(this.p.x, this.p.y, this.p.radius, rect)
  }

  update(dt) {
    stepProjectile(this.p, dt, this.tiles)
    if (this.p.dead) {
      this.destroy()
      return
    }
    this.sprite.setPosition(this.p.x, this.p.y)
    this.glow.setPosition(this.p.x, this.p.y)
    if (this.p.kind === PROJECTILE_KIND.SHOCKWAVE) this.sprite.setAlpha(1 - this.p.age / this.p.lifetime)
  }

  /** Hit the player: gone. */
  pop() {
    this.p.dead = true
    this.destroy()
  }

  destroy() {
    if (!this.sprite.active) return
    this.sprite.destroy()
    this.glow.destroy()
  }
}
