import Phaser from 'phaser'
import { DEPTH, GHOST, HIT_FLASH, LIBRARIAN, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_ANIMS, PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { damageGhost } from '../systems/ghostState.js'
import { createHitFlash, hitFlashOn, stepHitFlash } from '../systems/hitFlash.js'
import {
  LIBRARIAN_STATE,
  createLibrarianBrain,
  defeatLibrarian,
  isAwake,
  librarianCapturable,
  librarianDealsContactDamage,
  startLibrarianCapture,
  stepLibrarian,
} from '../systems/librarianBrain.js'
import { groundBelow } from '../systems/lineOfSight.js'
import { circleIntersectsRect } from '../systems/overlap.js'

const SHRIEKING = new Set([LIBRARIAN_STATE.WAKING, LIBRARIAN_STATE.WINDUP, LIBRARIAN_STATE.SWOOP])

/**
 * The Librarian, mini-boss of the Archive Vault. Her behaviour is in
 * systems/librarianBrain.js; this class draws her and plugs her into the
 * stream and the trap like a ghost (same interface as entities/Ghost.js).
 *
 * `data` is the room entity { id, x, y, anchors } in tiles.
 */
export class Librarian {
  constructor(scene, data, room) {
    this.scene = scene
    this.id = data.id
    this.kind = 'librarian'
    this.name = 'The Librarian'
    this.tiles = room.tiles
    this.width = room.width * TILE_SIZE
    const px = (t) => (t + 0.5) * TILE_SIZE
    this.brain = createLibrarianBrain(
      px(data.x),
      px(data.y),
      data.anchors.map((a) => ({ x: px(a.x), y: px(a.y) })),
    )
    this.tethered = false
    this.time = 0
    this.hitFlash = createHitFlash()
    this.hitThisFrame = false
    this.captureFrom = null

    this.glow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.librarian.glow))
      .setDepth(DEPTH.BOSS)
    this.sprite = scene.add.sprite(0, 0, PROGRESSION_TEXTURES.LIBRARIAN, 'float0').setDepth(DEPTH.BOSS)
    this.sprite.play(PROGRESSION_ANIMS.LIBRARIAN_FLOAT)
    this.trail = scene.add.particles(0, 0, PROGRESSION_TEXTURES.LIBRARIAN, {
      frame: 'float0',
      lifespan: GHOST.TRAIL_LIFETIME * 1000,
      frequency: GHOST.TRAIL_INTERVAL * 2000,
      alpha: { start: GHOST.TRAIL_ALPHA, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
    })
    this.trail.setDepth(DEPTH.GHOST_TRAIL)
    this.trail.startFollow(this.sprite)
    this.render()
  }

  get x() {
    return this.brain.x
  }

  get y() {
    return this.brain.y
  }

  get radius() {
    return LIBRARIAN.BODY_RADIUS
  }

  get state() {
    return this.brain.health
  }

  get awake() {
    return isAwake(this.brain)
  }

  get active() {
    return this.brain.state !== LIBRARIAN_STATE.DEFEATED
  }

  /** The stream only grips her once she's awake. */
  get targetable() {
    return this.awake && this.brain.state !== LIBRARIAN_STATE.CAPTURING
  }

  get capturable() {
    return librarianCapturable(this.brain)
  }

  get dealsContactDamage() {
    return librarianDealsContactDamage(this.brain)
  }

  /** 0..1 of her strength, for the boss bar. */
  get healthFraction() {
    return this.brain.health.hp / LIBRARIAN.MAX_HP
  }

  touches(rect) {
    return circleIntersectsRect(this.x, this.y, this.radius, rect)
  }

  takeStreamDamage(amount) {
    if (!this.targetable) return
    damageGhost(this.brain.health, amount, LIBRARIAN)
    this.hitThisFrame = true
  }

  recoil() {}

  /** Returns the brain's events ({ woke, book, stunned, recovered }). */
  update(dt, player, triggered) {
    this.time += dt
    stepHitFlash(this.hitFlash, dt, this.hitThisFrame, HIT_FLASH)
    this.hitThisFrame = false
    const floor = groundBelow(this.tiles, this.brain.x, this.brain.y)
    const events = stepLibrarian(this.brain, {
      playerX: player.x,
      playerY: player.y,
      triggered,
      tethered: this.tethered,
      floorY: floor,
    }, dt)
    this.brain.x = Phaser.Math.Clamp(this.brain.x, this.radius, this.width - this.radius)
    this.brain.y = Math.max(this.brain.y, this.radius)
    if (this.active) this.render()
    return events
  }

  startCapture() {
    startLibrarianCapture(this.brain)
    this.tethered = false
    this.captureFrom = { x: this.x, y: this.y }
    this.trail.stop()
  }

  updateCapture(trapX, trapY, progress) {
    const eased = progress * progress
    this.brain.x = Phaser.Math.Linear(this.captureFrom.x, trapX, eased)
    this.brain.y = Phaser.Math.Linear(this.captureFrom.y, trapY, eased)
    const scale = Phaser.Math.Linear(1, LIBRARIAN.CAPTURE_END_SCALE, eased)
    this.sprite.setPosition(this.x, this.y).setScale(scale, scale * (1 + eased)).setFrame('shriek')
    this.glow.setPosition(this.x, this.y).setScale(LIBRARIAN.GLOW_SCALE * scale)
  }

  /** Trapped: she's beaten. */
  capture() {
    defeatLibrarian(this.brain)
    this.sprite.setVisible(false)
    this.glow.setVisible(false)
    this.trail.stop()
    return { defeated: true }
  }

  render() {
    const { state } = this.brain
    const bob = Math.sin(this.time * LIBRARIAN.BOB_SPEED) * LIBRARIAN.BOB_AMPLITUDE
    const jitter = state === LIBRARIAN_STATE.WINDUP ? Phaser.Math.Between(-LIBRARIAN.WINDUP_JITTER, LIBRARIAN.WINDUP_JITTER) : 0
    const x = this.x + jitter
    const y = this.y + bob
    this.sprite.setPosition(x, y)
    this.glow.setPosition(x, y).setScale(LIBRARIAN.GLOW_SCALE).setAlpha(LIBRARIAN.GLOW_ALPHA)
    if (Math.abs(this.brain.vx) > 1) this.sprite.setFlipX(this.brain.vx < 0)

    if (SHRIEKING.has(state)) {
      this.sprite.anims.stop()
      this.sprite.setFrame('shriek')
    } else if (!this.sprite.anims.isPlaying) {
      this.sprite.play(PROGRESSION_ANIMS.LIBRARIAN_FLOAT)
    }

    if (state === LIBRARIAN_STATE.DORMANT) {
      // Asleep among the shelves: faint and still.
      this.sprite.setAlpha(0.45).clearTint()
      this.glow.setAlpha(LIBRARIAN.GLOW_ALPHA * 0.4)
    } else if (state === LIBRARIAN_STATE.STUNNED) {
      const on = Math.floor(this.time * LIBRARIAN.STUN_FLICKER_RATE) % 2 === 0
      this.sprite.setTint(PALETTE.ghost.weakened).setAlpha(on ? 1 : LIBRARIAN.STUN_FLICKER_ALPHA)
    } else {
      this.sprite.clearTint().setAlpha(1)
    }
    if (hitFlashOn(this.hitFlash, HIT_FLASH)) this.sprite.setTintFill(PALETTE.hitFlash)
  }

  destroy() {
    this.sprite.destroy()
    this.glow.destroy()
    this.trail.destroy()
  }
}
