import Phaser from 'phaser'
import { DEPTH, TRAP } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { approach } from '../systems/movement.js'
import {
  TRAP_STATE,
  canThrow,
  captureProgress,
  createTrap,
  recallTrap,
  stepTrap,
  throwTrap,
  throwVelocity,
} from '../systems/trapLogic.js'

/**
 * The ghost trap: thrown in an arc, lands, opens, and pulls a weakened
 * ghost in through a cone of light. The rules are in systems/trapLogic.js.
 */
export class Trap {
  constructor(scene) {
    this.logic = createTrap()

    this.hitbox = scene.add.zone(0, 0, TRAP.BODY_WIDTH, TRAP.BODY_HEIGHT)
    scene.physics.add.existing(this.hitbox)
    this.body = this.hitbox.body
    this.body.setGravityY(TRAP.GRAVITY)

    this.beam = scene.add.graphics().setDepth(DEPTH.TRAP_BEAM).setBlendMode(Phaser.BlendModes.ADD)
    this.glow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setDepth(DEPTH.TRAP_BEAM)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.trap.beam))
      .setScale(TRAP.GLOW_SCALE)
    this.sprite = scene.add.sprite(0, 0, COMBAT_TEXTURES.TRAP, 'closed').setOrigin(0.5, 1).setDepth(DEPTH.TRAP)
    this.time = 0
    this.hide()
  }

  get state() {
    return this.logic.state
  }

  get capturing() {
    return this.logic.state === TRAP_STATE.CAPTURING
  }

  /** 0..1 while a ghost is being pulled in. */
  get progress() {
    return captureProgress(this.logic)
  }

  get canThrow() {
    return canThrow(this.logic)
  }

  /** Throws from the player's feet, aiming beneath `targetX` when given. */
  throw(fromX, feetY, targetX, facing) {
    if (!throwTrap(this.logic)) return false
    const { vx, vy } = throwVelocity(fromX, targetX, facing)
    this.body.enable = true
    this.body.reset(fromX, feetY - TRAP.THROW_HEIGHT)
    this.body.setVelocity(vx, vy)
    this.sprite.setVisible(true).setFrame('closed')
    return true
  }

  /**
   * `ghosts` are the live Ghost entities. Returns the trapLogic events with
   * ghost ids resolved to Ghost entities.
   */
  update(dt, ghosts) {
    this.time += dt
    if (this.logic.state === TRAP_STATE.READY) {
      stepTrap(this.logic, { x: 0, y: 0, grounded: false, candidates: [] }, dt)
      return { armed: false, captureStarted: null, captured: null, returned: false }
    }

    const grounded = this.body.blocked.down
    if (grounded) this.body.setVelocityX(approach(this.body.velocity.x, 0, TRAP.GROUND_FRICTION * dt))

    const x = this.body.center.x
    const y = this.body.bottom
    const candidates = ghosts.map((g) => ({ id: g.id, x: g.x, y: g.y, capturable: g.capturable }))
    const events = stepTrap(this.logic, { x, y, grounded, candidates }, dt)
    if (events.armed) this.body.setVelocityX(0)
    if (events.returned) this.hide()

    const byId = (id) => ghosts.find((g) => g.id === id) ?? null
    const resolved = { ...events, captureStarted: byId(events.captureStarted), captured: byId(events.captured) }

    this.render(byId(this.logic.targetId))
    return resolved
  }

  /** Puts the trap away immediately (used on respawn). */
  recall() {
    recallTrap(this.logic)
    this.hide()
  }

  hide() {
    this.body.stop()
    this.body.enable = false
    this.sprite.setVisible(false)
    this.glow.setVisible(false)
    this.beam.clear()
  }

  get mouth() {
    return { x: this.body.center.x, y: this.body.bottom - TRAP.BODY_HEIGHT }
  }

  render(target) {
    const { state } = this.logic
    if (state === TRAP_STATE.READY) return
    const open = state === TRAP_STATE.ARMED || state === TRAP_STATE.CAPTURING
    this.sprite.setPosition(this.body.center.x, this.body.bottom).setFrame(open ? 'open' : 'closed')

    this.beam.clear()
    const capturing = state === TRAP_STATE.CAPTURING && target
    this.glow.setVisible(capturing).setPosition(this.mouth.x, this.mouth.y)
    if (!capturing) return

    // A cone of pale light from the trap's mouth up to the ghost.
    const flicker = 1 + Math.sin(this.time * TRAP.BEAM_FLICKER_SPEED) * TRAP.BEAM_FLICKER_AMOUNT
    const progress = captureProgress(this.logic)
    const { x, y } = this.mouth
    const topHalfWidth = TRAP.CAPTURE_HALF_WIDTH * (1 - progress) + TRAP.BEAM_BASE_HALF_WIDTH
    this.beam.fillStyle(toColor(PALETTE.trap.beam), TRAP.BEAM_ALPHA * flicker)
    this.beam.fillTriangle(
      x - TRAP.BEAM_BASE_HALF_WIDTH,
      y,
      x + TRAP.BEAM_BASE_HALF_WIDTH,
      y,
      target.x + topHalfWidth,
      target.y,
    )
    this.beam.fillTriangle(
      x - TRAP.BEAM_BASE_HALF_WIDTH,
      y,
      target.x + topHalfWidth,
      target.y,
      target.x - topHalfWidth,
      target.y,
    )
    this.glow.setAlpha(TRAP.GLOW_ALPHA * flicker)
  }
}
