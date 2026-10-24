import { PLAYER, PLAYER_FEEL } from '../constants.js'
import { PLAYER_ANIMS, TEXTURES } from '../art/generateTextures.js'
import { createMovementState, stepMovement } from '../systems/movement.js'
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

    this.motion = createMovementState()
    this.squash = createSquash()
    this.facing = 1
  }

  update(input, dt) {
    const move = input.horizontal
    const events = stepMovement(
      this.motion,
      { move, jumpPressed: input.justPressed('jump'), jumpHeld: input.isDown('jump') },
      { grounded: this.body.blocked.down, vx: this.body.velocity.x, vy: this.body.velocity.y },
      dt,
    )
    this.body.setVelocity(this.motion.vx, this.motion.vy)
    if (move !== 0) this.facing = move

    if (events.jumped) stretchForJump(this.squash)
    if (events.landed) squashForLanding(this.squash, events.landingSpeed)
    relaxSquash(this.squash, dt)

    this.updateSprite()
  }

  updateSprite() {
    this.sprite
      .setPosition(this.body.center.x, this.body.bottom)
      .setFlipX(this.facing < 0)
      .setScale(this.squash.x, this.squash.y)
      .play(this.currentAnimation(), true)
  }

  currentAnimation() {
    const { grounded, vx, vy } = this.motion
    if (grounded) return Math.abs(vx) > PLAYER_FEEL.RUN_ANIM_MIN_SPEED ? PLAYER_ANIMS.RUN : PLAYER_ANIMS.IDLE
    return vy < 0 ? PLAYER_ANIMS.JUMP : PLAYER_ANIMS.FALL
  }
}
