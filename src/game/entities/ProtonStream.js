import Phaser from 'phaser'
import { DEPTH, PROTON_STREAM } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { GHOST_STATUS } from '../systems/ghostState.js'
import { selectStreamTarget, streamEndpoint } from '../systems/streamTargeting.js'

const STREAM_COLORS = {
  core: toColor(PALETTE.stream.core),
  inner: toColor(PALETTE.stream.inner),
  outer: toColor(PALETTE.stream.outer),
  grip: toColor(PALETTE.stream.grip),
}

/**
 * The proton stream: picks a target (systems/streamTargeting.js) and draws
 * a wobbling beam from the pack nozzle to the ghost it holds, or to the
 * end of its range. Damage is applied by the scene.
 */
export class ProtonStream {
  constructor(scene, tiles) {
    this.tiles = tiles
    this.targetId = null
    this.time = 0
    this.sparkDebt = 0

    this.graphics = scene.add.graphics().setDepth(DEPTH.STREAM).setBlendMode(Phaser.BlendModes.ADD)
    this.nozzleGlow = scene.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setDepth(DEPTH.STREAM)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(STREAM_COLORS.inner)
      .setScale(PROTON_STREAM.NOZZLE_GLOW_SCALE)
      .setAlpha(PROTON_STREAM.NOZZLE_GLOW_ALPHA)
      .setVisible(false)
    this.sparks = scene.add.particles(0, 0, COMBAT_TEXTURES.SPARK, {
      emitting: false,
      lifespan: PROTON_STREAM.SPARK_LIFETIME * 1000,
      speed: { min: PROTON_STREAM.SPARK_SPEED_MIN, max: PROTON_STREAM.SPARK_SPEED_MAX },
      alpha: { start: 1, end: 0 },
      blendMode: Phaser.BlendModes.ADD,
    })
    this.sparks.setDepth(DEPTH.STREAM)
  }

  /**
   * `origin` is the nozzle, `ghosts` the live Ghost entities. Returns the
   * tethered ghost, or null.
   */
  update(dt, firing, origin, facing, ghosts) {
    this.time += dt
    this.graphics.clear()
    if (!firing) {
      this.targetId = null
      this.nozzleGlow.setVisible(false)
      return null
    }

    const candidates = ghosts.filter((g) => g.state.status === GHOST_STATUS.FREE).map((g) => ({ id: g.id, x: g.x, y: g.y }))
    this.targetId = selectStreamTarget(origin, facing, candidates, this.tiles, this.targetId)
    const target = ghosts.find((g) => g.id === this.targetId) ?? null
    const end = target ? { x: target.x, y: target.y } : streamEndpoint(origin, facing, this.tiles)

    this.draw(origin, end, target !== null)
    this.nozzleGlow.setVisible(true).setPosition(origin.x, origin.y)
    this.emitSparks(end, dt)
    return target
  }

  stop() {
    this.targetId = null
    this.graphics.clear()
    this.nozzleGlow.setVisible(false)
  }

  draw(origin, end, gripping) {
    const t = PROTON_STREAM
    const dx = end.x - origin.x
    const dy = end.y - origin.y
    const length = Math.hypot(dx, dy) || 1
    const nx = -dy / length
    const ny = dx / length

    // Two interleaved sine wobbles, pinned at both ends so the beam stays
    // attached to the nozzle and the target.
    const points = []
    for (let i = 0; i <= t.SEGMENTS; i++) {
      const u = i / t.SEGMENTS
      const envelope = Math.sin(Math.PI * u)
      const phase = u * t.WOBBLE_WAVES * Math.PI * 2 - this.time * t.WOBBLE_SPEED
      const offset = (Math.sin(phase) + t.HARMONIC_GAIN * Math.sin(phase * t.HARMONIC_RATIO + t.HARMONIC_PHASE)) * t.WOBBLE_AMPLITUDE * envelope
      points.push(new Phaser.Math.Vector2(origin.x + dx * u + nx * offset, origin.y + dy * u + ny * offset))
    }

    const g = this.graphics
    g.lineStyle(t.GLOW_WIDTH, STREAM_COLORS.outer, t.GLOW_ALPHA)
    g.strokePoints(points)
    g.lineStyle(t.INNER_WIDTH, STREAM_COLORS.inner, t.INNER_ALPHA)
    g.strokePoints(points)
    g.lineStyle(t.CORE_WIDTH, STREAM_COLORS.core, 1)
    g.strokePoints(points)

    if (gripping) {
      const wobble = Math.sin(this.time * t.GRIP_PULSE_SPEED)
      g.lineStyle(t.CORE_WIDTH, STREAM_COLORS.grip, t.GRIP_ALPHA)
      g.strokeCircle(end.x, end.y, t.GRIP_RADIUS + wobble)
    }
  }

  emitSparks(at, dt) {
    this.sparkDebt += PROTON_STREAM.SPARKS_PER_SECOND * dt
    const count = Math.floor(this.sparkDebt)
    if (count === 0) return
    this.sparkDebt -= count
    this.sparks.emitParticleAt(at.x, at.y, count)
  }
}
