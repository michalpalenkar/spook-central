import Phaser from 'phaser'
import { DEPTH, GATES, PLAYER, PLAYER_COMBAT, PLAYER_FEEL, PROTON_STREAM } from '../constants.js'
import { toColor } from '../art/color.js'
import { PLAYER_ANIMS, TEXTURES } from '../art/generateTextures.js'
import { PALETTE } from '../art/palette.js'
import { createHealth, isDead, isInvulnerable, restoreHealth, takeDamage, tickHealth } from '../systems/health.js'
import { createMovementState, isDashing, stepMovement } from '../systems/movement.js'
import { createSquash, relaxSquash, squashForLanding, stretchForJump } from '../systems/squashStretch.js'

/**
 * The Ghostbuster. Physics runs on an invisible hitbox; the sprite follows
 * it with its origin at the feet, so squash and stretch never change the
 * collision shape.
 */
export class Player {
  constructor(scene, x, feetY) {
    this.hitbox = scene.add.zone(x, feetY - PLAYER.BODY_HEIGHT / 2, PLAYER.BODY_WIDTH, PLAYER.BODY_HEIGHT)
    scene.physics.add.existing(this.hitbox)
    this.body = this.hitbox.body

    this.sprite = scene.add.sprite(x, feetY, TEXTURES.PLAYER, 'idle').setOrigin(0.5, 1)
    this.sprite.play(PLAYER_ANIMS.IDLE)
    this.scene = scene
    this.dashTrailTimer = 0

    this.motion = createMovementState()
    this.squash = createSquash()
    this.facing = 1
    this.health = createHealth()
    this.knockbackTimer = 0
    this.knockbackVx = 0
    this.time = 0
  }

  get dead() {
    return isDead(this.health)
  }

  get center() {
    return { x: this.body.center.x, y: this.body.center.y }
  }

  /** Where the proton stream leaves the pack's wand. */
  get nozzle() {
    return {
      x: this.body.center.x + this.facing * PROTON_STREAM.NOZZLE_OFFSET_X,
      y: this.body.bottom + PROTON_STREAM.NOZZLE_OFFSET_Y,
    }
  }

  get dashing() {
    return isDashing(this.motion)
  }

  get clinging() {
    return this.motion.wallSide !== 0
  }

  /** The body's rect in room pixels. */
  get rect() {
    const { x, y, width, height } = this.body
    return { x, y, width, height }
  }

  /**
   * `options.moveScale` slows running (e.g. while firing); `options.faceX`
   * turns the player toward a point (a tethered ghost) regardless of input.
   * `abilities` is { dash, cling }; `wall` the side touching a slimed wall
   * and `insideBarrier` whether the body is in ectoplasm (see
   * systems/movement.js).
   */
  update(input, dt, { moveScale = 1, faceX = null, abilities, wall = 0, insideBarrier = false } = {}) {
    this.time += dt
    tickHealth(this.health, dt)
    if (this.dead) return

    this.knockbackTimer = Math.max(0, this.knockbackTimer - dt)
    const knockedBack = this.knockbackTimer > 0
    const move = knockedBack ? 0 : input.horizontal * moveScale
    const events = stepMovement(
      this.motion,
      {
        move,
        jumpPressed: !knockedBack && input.justPressed('jump'),
        jumpHeld: input.isDown('jump'),
        dashPressed: !knockedBack && input.justPressed('dash'),
        facing: this.facing,
        abilities,
      },
      { grounded: this.body.blocked.down, vx: this.body.velocity.x, vy: this.body.velocity.y, wall, insideBarrier },
      dt,
    )
    if (knockedBack) this.motion.vx = this.knockbackVx
    this.body.setVelocity(this.motion.vx, this.motion.vy)
    // Ectoplasm barriers let a dashing body through (systems/buildRoom.js).
    this.hitbox.passesBarriers = this.dashing

    if (this.dashing) this.facing = this.motion.dashDir
    else if (this.clinging) this.facing = -this.motion.wallSide
    else if (faceX !== null) this.facing = faceX < this.body.center.x ? -1 : 1
    else if (move !== 0) this.facing = Math.sign(move)

    if (events.jumped || events.wallJumped) stretchForJump(this.squash)
    if (events.landed) squashForLanding(this.squash, events.landingSpeed)
    relaxSquash(this.squash, dt)

    this.updateSprite()
    this.updateDashTrail(dt, events.dashed)
    this.lastEvents = events
  }

  // Fading green afterimages while dashing.
  updateDashTrail(dt, started) {
    if (!this.dashing) return
    this.dashTrailTimer -= dt
    if (!started && this.dashTrailTimer > 0) return
    this.dashTrailTimer = GATES.DASH_TRAIL_INTERVAL
    const ghost = this.scene.add
      .image(this.sprite.x, this.sprite.y, TEXTURES.PLAYER, this.sprite.frame.name)
      .setOrigin(0.5, 1)
      .setFlipX(this.sprite.flipX)
      .setTint(toColor(PALETTE.accent.ecto))
      .setAlpha(GATES.DASH_TRAIL_ALPHA)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.PLAYER - 1)
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: GATES.DASH_TRAIL_LIFETIME * 1000,
      onComplete: () => ghost.destroy(),
    })
  }

  /** Takes a hit from something at `fromX`. Returns whether it landed. */
  hurt(amount, fromX) {
    if (!takeDamage(this.health, amount)) return false
    const away = Math.sign(this.body.center.x - fromX) || -this.facing
    this.knockbackVx = away * PLAYER_COMBAT.KNOCKBACK_SPEED_X
    this.knockbackTimer = PLAYER_COMBAT.KNOCKBACK_TIME
    this.motion.vy = -PLAYER_COMBAT.KNOCKBACK_SPEED_Y
    this.motion.isJumping = false
    this.body.setVelocity(this.knockbackVx, this.motion.vy)
    if (this.dead) this.die()
    return true
  }

  die() {
    this.body.stop()
    this.body.enable = false
    this.sprite.setTint(PALETTE.deathFlash).setAlpha(1).play(PLAYER_ANIMS.FALL, true)
  }

  respawn(x, feetY) {
    restoreHealth(this.health)
    this.body.enable = true
    this.body.reset(x, feetY - PLAYER.BODY_HEIGHT / 2)
    this.motion = createMovementState()
    this.squash = createSquash()
    this.knockbackTimer = 0
    this.facing = 1
    this.sprite.clearTint().setAlpha(1)
    this.updateSprite()
  }

  updateSprite() {
    // Blink while invulnerable after a hit.
    const blinkOn = Math.floor(this.time * PLAYER_COMBAT.INVULNERABLE_BLINK_RATE) % 2 === 0
    this.sprite
      .setPosition(this.body.center.x, this.body.bottom)
      .setFlipX(this.facing < 0)
      .setScale(this.squash.x, this.squash.y)
      .setAlpha(isInvulnerable(this.health) && !blinkOn ? PLAYER_COMBAT.INVULNERABLE_BLINK_ALPHA : 1)
      .play(this.currentAnimation(), true)
  }

  currentAnimation() {
    const { grounded, vx, vy } = this.motion
    if (this.dashing) return PLAYER_ANIMS.RUN
    if (this.clinging) return PLAYER_ANIMS.FALL
    if (grounded) return Math.abs(vx) > PLAYER_FEEL.RUN_ANIM_MIN_SPEED ? PLAYER_ANIMS.RUN : PLAYER_ANIMS.IDLE
    return vy < 0 ? PLAYER_ANIMS.JUMP : PLAYER_ANIMS.FALL
  }
}
