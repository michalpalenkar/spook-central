import Phaser from 'phaser'
import { DEPTH, MALLOW, PROJECTILE, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { damageGhost } from '../systems/ghostState.js'
import {
  MALLOW_STATE,
  createMallowBrain,
  mallowCapturable,
  mallowCaptured,
  mallowCore,
  mallowDealsContactDamage,
  startMallowCapture,
  stepMallow,
} from '../systems/mallowBrain.js'

const ANGRY = new Set([MALLOW_STATE.WINDUP, MALLOW_STATE.AIRBORNE, MALLOW_STATE.ROAR, MALLOW_STATE.WAKING])
// Globs leave from his raised hand, this far above his feet.
const THROW_HEIGHT_FRACTION = 0.8

/**
 * The marshmallow mascot, final boss of the Spook Central roof. His
 * behaviour is in systems/mallowBrain.js; this class draws him and plugs
 * him into the stream and trap (same interface as entities/Ghost.js), aimed
 * at his head.
 *
 * `data` is the room entity { id, x, y } in tiles, `y` the row he stands in.
 */
export class Mallow {
  constructor(scene, data, room) {
    this.scene = scene
    this.id = data.id
    this.kind = 'mallow'
    this.name = 'The Marshmallow Mascot'
    this.floorY = (data.y + 1) * TILE_SIZE
    this.minX = TILE_SIZE + MALLOW.BODY_WIDTH / 2
    this.maxX = (room.width - 1) * TILE_SIZE - MALLOW.BODY_WIDTH / 2
    this.brain = createMallowBrain((data.x + 0.5) * TILE_SIZE, this.floorY)
    this.tethered = false
    this.time = 0

    this.glow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.mallow.glow))
      .setScale(MALLOW.GLOW_SCALE)
      .setAlpha(MALLOW.GLOW_ALPHA)
      .setDepth(DEPTH.BOSS)
    this.sprite = scene.add.sprite(0, 0, PROGRESSION_TEXTURES.MALLOW, 'stand').setOrigin(0.5, 1).setDepth(DEPTH.BOSS)
    this.puffs = scene.add.particles(0, 0, PROGRESSION_TEXTURES.GLOB, {
      emitting: false,
      lifespan: MALLOW.DEFEAT_TIME * 1000,
      speed: { min: 40, max: 160 },
      angle: { min: 200, max: 340 },
      gravityY: PROJECTILE.GLOB_GRAVITY / 2,
      scale: { start: 1.4, end: 0.4 },
      alpha: { start: 1, end: 0 },
    })
    this.puffs.setDepth(DEPTH.BOSS)
    this.render()
  }

  /** His head: where the stream grips and the trap pulls. */
  get x() {
    return mallowCore(this.brain).x
  }

  get y() {
    return mallowCore(this.brain).y
  }

  get state() {
    return this.brain.health
  }

  get phase() {
    return this.brain.phase
  }

  get awake() {
    return this.brain.state !== MALLOW_STATE.DORMANT && this.brain.state !== MALLOW_STATE.DEFEATED
  }

  get active() {
    return this.brain.state !== MALLOW_STATE.DEFEATED
  }

  get targetable() {
    return this.awake && this.brain.state !== MALLOW_STATE.CAPTURING && this.brain.state !== MALLOW_STATE.ROAR
  }

  get capturable() {
    return mallowCapturable(this.brain)
  }

  get dealsContactDamage() {
    return mallowDealsContactDamage(this.brain)
  }

  get healthFraction() {
    return this.brain.health.hp / MALLOW.MAX_HP
  }

  /** His body is a box standing on his feet. */
  touches(rect) {
    const kneeling = this.brain.state === MALLOW_STATE.KNEEL
    const height = MALLOW.BODY_HEIGHT * (kneeling ? MALLOW.KNEEL_SCALE_Y : 1)
    const left = this.brain.x - MALLOW.BODY_WIDTH / 2
    const top = this.brain.feetY - height
    return rect.x < left + MALLOW.BODY_WIDTH && rect.x + rect.width > left && rect.y < top + height && rect.y + rect.height > top
  }

  takeStreamDamage(amount) {
    if (this.targetable) damageGhost(this.brain.health, amount, MALLOW)
  }

  recoil() {}

  /** Returns the brain's events ({ woke, landed, globs, kneeled, recovered }). */
  update(dt, player, triggered) {
    this.time += dt
    const events = stepMallow(this.brain, {
      playerX: player.x,
      triggered,
      floorY: this.floorY,
      minX: this.minX,
      maxX: this.maxX,
      globGravity: PROJECTILE.GLOB_GRAVITY,
      throwFrom: MALLOW.BODY_HEIGHT * THROW_HEIGHT_FRACTION,
    }, dt)
    if (this.active) this.render()
    return events
  }

  startCapture() {
    startMallowCapture(this.brain)
    this.tethered = false
  }

  /** The trap tears at his spirit: he shudders and shrinks a little. */
  updateCapture(_trapX, _trapY, progress) {
    const shrink = 1 - MALLOW.CAPTURE_SHRINK * progress
    const shake = Phaser.Math.Between(-1, 1)
    this.sprite
      .setPosition(this.brain.x + shake, this.brain.feetY)
      .setScale(shrink, shrink * MALLOW.KNEEL_SCALE_Y)
      .setTint(PALETTE.deathFlash)
  }

  /** Returns { defeated } — false while he has rounds left. */
  capture() {
    const defeated = mallowCaptured(this.brain)
    if (defeated) {
      this.puffs.explode(MALLOW.DEFEAT_PUFFS, this.brain.x, this.brain.feetY - MALLOW.BODY_HEIGHT / 2)
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        alpha: 0,
        scaleY: 0.2,
        duration: MALLOW.DEFEAT_TIME * 1000,
        ease: 'Quad.easeIn',
      })
    }
    return { defeated }
  }

  render() {
    const { state, x, feetY } = this.brain
    const walking = state === MALLOW_STATE.WALK
    const bob = walking ? Math.abs(Math.sin(this.time * MALLOW.WALK_BOB_SPEED)) * MALLOW.WALK_BOB_AMPLITUDE : 0
    let scaleY = 1
    if (state === MALLOW_STATE.WINDUP || state === MALLOW_STATE.LANDED) scaleY = MALLOW.CROUCH_SCALE_Y
    if (state === MALLOW_STATE.KNEEL) scaleY = MALLOW.KNEEL_SCALE_Y
    const scaleX = 2 - scaleY

    this.sprite
      .setPosition(x, feetY - bob)
      .setScale(scaleX, scaleY)
      .setFlipX(this.brain.facing > 0)
      .setFrame(ANGRY.has(state) || this.brain.phase > 1 ? 'angry' : 'stand')
    this.glow.setPosition(x, feetY - MALLOW.BODY_HEIGHT / 2)

    if (state === MALLOW_STATE.KNEEL) {
      const on = Math.floor(this.time * 8) % 2 === 0
      this.sprite.setTint(PALETTE.mallow.weakened).setAlpha(on ? 1 : 0.7)
    } else if (state === MALLOW_STATE.DORMANT) {
      this.sprite.clearTint().setAlpha(0.85)
    } else {
      this.sprite.clearTint().setAlpha(1)
    }
  }

  destroy() {
    this.sprite.destroy()
    this.glow.destroy()
    this.puffs.destroy()
  }
}
