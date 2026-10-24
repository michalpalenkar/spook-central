import Phaser from 'phaser'
import { DEPTH, GHOST, SLIMER } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_ANIMS, PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { CHASE_MODE, createFlight, stepFlight } from '../systems/slimerChase.js'
import { GHOST_LOOK } from './Ghost.js'

/** Slimer's look and tuning for the cornered fight, where he is a Ghost. */
export const SLIMER_LOOK = {
  ...GHOST_LOOK,
  kind: 'slimer',
  tuning: SLIMER,
  texture: PROGRESSION_TEXTURES.SLIMER,
  frame: 'chomp0',
  anim: PROGRESSION_ANIMS.SLIMER_CHOMP,
  glow: PALETTE.slimer.glow,
}

/**
 * Slimer on the run: he munches at a waypoint until the player comes close,
 * then zips to the next one, and past the last he leaves the room. He can't
 * be hurt or trapped until he is cornered (then the scene spawns him as a
 * Ghost with SLIMER_LOOK). The rules are in systems/slimerChase.js.
 */
export class Slimer {
  constructor(scene, waypointsInTiles, tileSize) {
    this.waypoints = waypointsInTiles.map((p) => ({ x: (p.x + 0.5) * tileSize, y: (p.y + 0.5) * tileSize }))
    this.flight = createFlight(this.waypoints)
    this.time = 0

    this.glow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.slimer.glow))
      .setScale(SLIMER.GLOW_SCALE)
      .setAlpha(GHOST.GLOW_ALPHA)
      .setDepth(DEPTH.GHOST)
    this.sprite = scene.add.sprite(0, 0, PROGRESSION_TEXTURES.SLIMER, 'chomp0').setDepth(DEPTH.GHOST)
    this.sprite.play(PROGRESSION_ANIMS.SLIMER_CHOMP)
    this.trail = scene.add.particles(0, 0, PROGRESSION_TEXTURES.SLIMER, {
      frame: 'chomp0',
      lifespan: GHOST.TRAIL_LIFETIME * 1000,
      frequency: GHOST.TRAIL_INTERVAL * 1000,
      alpha: { start: GHOST.TRAIL_ALPHA, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
    })
    this.trail.setDepth(DEPTH.GHOST_TRAIL)
    this.trail.startFollow(this.sprite)
    this.render(0)
  }

  get gone() {
    return this.flight.mode === CHASE_MODE.GONE
  }

  get x() {
    return this.flight.x
  }

  get y() {
    return this.flight.y
  }

  /** Returns the chase events ({ fled, left }). */
  update(dt, player) {
    this.time += dt
    if (this.gone) return { fled: false, left: false }
    const before = this.flight.x
    const events = stepFlight(this.flight, this.waypoints, player, dt)
    if (events.left) {
      this.sprite.setVisible(false)
      this.glow.setVisible(false)
      this.trail.stop()
      return events
    }
    this.render(this.flight.x - before)
    return events
  }

  render(dx) {
    const fleeing = this.flight.mode === CHASE_MODE.FLEEING
    const bob = Math.sin(this.time * GHOST.BOB_SPEED * (fleeing ? 3 : 1)) * GHOST.BOB_AMPLITUDE
    const x = this.flight.x
    const y = this.flight.y + bob
    if (Math.abs(dx) > 0.01) this.sprite.setFlipX(dx < 0)
    this.sprite.setPosition(x, y)
    this.glow.setPosition(x, y)
  }
}
