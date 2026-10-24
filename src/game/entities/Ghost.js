import Phaser from 'phaser'
import { DEPTH, GHOST, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES, GHOST_ANIMS } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import {
  GHOST_STATUS,
  canBeCaptured,
  createGhostState,
  dealsContactDamage,
  isWeakened,
  resetGhostState,
  tickGhostState,
} from '../systems/ghostState.js'
import { createSteering, startRecoil, stepSteering } from '../systems/ghostSteering.js'
import { groundBelow } from '../systems/lineOfSight.js'

/**
 * A free-floating ghost. It flies through walls, chases the player, can be
 * worn down with the proton stream and then pulled into a trap. All rules
 * live in systems/ghostState.js and systems/ghostSteering.js; this class
 * moves the sprites.
 */
export class Ghost {
  constructor(scene, { id, x, y }, room) {
    this.scene = scene
    this.id = id
    this.tiles = room.tiles
    this.bounds = { width: room.width * TILE_SIZE, height: room.height * TILE_SIZE }
    this.homeX = (x + 0.5) * TILE_SIZE
    this.homeY = (y + 0.5) * TILE_SIZE

    this.glow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.ghost.glow))
      .setDepth(DEPTH.GHOST)
    this.sprite = scene.add.sprite(0, 0, COMBAT_TEXTURES.GHOST, 'sway0').setDepth(DEPTH.GHOST)
    this.sprite.play(GHOST_ANIMS.FLOAT)
    this.trail = scene.add.particles(0, 0, COMBAT_TEXTURES.GHOST, {
      frame: 'sway0',
      lifespan: GHOST.TRAIL_LIFETIME * 1000,
      frequency: GHOST.TRAIL_INTERVAL * 1000,
      alpha: { start: GHOST.TRAIL_ALPHA, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
    })
    this.trail.setDepth(DEPTH.GHOST_TRAIL)
    this.trail.startFollow(this.sprite)

    this.state = createGhostState()
    this.reset()
  }

  reset() {
    resetGhostState(this.state)
    this.steering = createSteering(Math.random() * Math.PI * 2)
    this.x = this.homeX
    this.y = this.homeY
    this.time = Math.random() * Math.PI * 2
    this.tethered = false
    this.captureFrom = null
    for (const object of [this.sprite, this.glow]) object.setVisible(true).setScale(1).setAlpha(1)
    this.trail.start()
    this.render()
  }

  get active() {
    return this.state.status !== GHOST_STATUS.CAPTURED
  }

  get weakened() {
    return isWeakened(this.state)
  }

  get capturable() {
    return canBeCaptured(this.state)
  }

  get dealsContactDamage() {
    return dealsContactDamage(this.state)
  }

  /** Called when the ghost touches the player. */
  recoil() {
    startRecoil(this.steering)
  }

  update(dt, player) {
    this.time += dt
    if (this.state.status === GHOST_STATUS.FREE) {
      tickGhostState(this.state, dt)
      stepSteering(
        this.steering,
        {
          x: this.x,
          y: this.y,
          homeX: this.homeX,
          homeY: this.homeY,
          playerX: player.x,
          playerY: player.y,
          tethered: this.tethered,
          weakened: this.weakened,
        },
        dt,
      )
      this.x += this.steering.vx * dt
      this.y += this.steering.vy * dt
      this.keepInRoom()
    }
    if (this.active) this.render()
  }

  // Ghosts pass through walls, but never sink into the floor beneath them
  // or leave the room.
  keepInRoom() {
    const r = GHOST.BODY_RADIUS
    this.x = Phaser.Math.Clamp(this.x, r, this.bounds.width - r)
    this.y = Phaser.Math.Clamp(this.y, r, this.bounds.height - r)
    const floor = groundBelow(this.tiles, this.x, this.y)
    if (floor !== null) this.y = Math.min(this.y, floor - GHOST.MIN_HOVER_HEIGHT)
  }

  startCapture() {
    this.state.status = GHOST_STATUS.CAPTURING
    this.tethered = false
    this.captureFrom = { x: this.x, y: this.y }
    this.trail.stop()
  }

  /** Pulls the ghost down into the trap; progress runs 0..1. */
  updateCapture(trapX, trapY, progress) {
    const eased = progress * progress
    this.x = Phaser.Math.Linear(this.captureFrom.x, trapX, eased)
    this.y = Phaser.Math.Linear(this.captureFrom.y, trapY, eased)
    const scale = Phaser.Math.Linear(1, GHOST.CAPTURE_END_SCALE, eased)
    this.sprite.setScale(scale, scale * (1 + eased))
    this.glow.setScale(GHOST.GLOW_SCALE * scale)
  }

  capture() {
    this.state.status = GHOST_STATUS.CAPTURED
    this.sprite.setVisible(false)
    this.glow.setVisible(false)
    this.trail.stop()
  }

  render() {
    const capturing = this.state.status === GHOST_STATUS.CAPTURING
    const bob = capturing ? 0 : Math.sin(this.time * GHOST.BOB_SPEED) * GHOST.BOB_AMPLITUDE
    const beingHit = this.state.sinceHit < GHOST.HIT_JITTER_TIME
    const jitter = beingHit ? Phaser.Math.Between(-GHOST.HIT_JITTER, GHOST.HIT_JITTER) : 0
    const x = this.x + jitter
    const y = this.y + bob

    this.sprite.setPosition(x, y)
    if (Math.abs(this.steering.vx) > 1) this.sprite.setFlipX(this.steering.vx < 0)
    this.glow.setPosition(x, y)

    if (capturing) return
    const pulse = 1 + Math.sin(this.time * GHOST.GLOW_PULSE_SPEED) * GHOST.GLOW_PULSE_AMOUNT
    this.glow.setScale(GHOST.GLOW_SCALE * pulse).setAlpha(GHOST.GLOW_ALPHA * pulse)

    if (this.weakened) {
      // Dazed: dimmer, and flickering to say "trap me now".
      const on = Math.floor(this.time * GHOST.WEAKENED_FLICKER_RATE) % 2 === 0
      this.sprite.setTint(PALETTE.ghost.weakened).setAlpha(on ? 1 : GHOST.WEAKENED_FLICKER_ALPHA)
    } else {
      this.sprite.clearTint().setAlpha(1)
    }
  }
}
