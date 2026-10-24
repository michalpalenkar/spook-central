import Phaser from 'phaser'
import { DEPTH, GATES, TILE_SIZE } from '../constants.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { ABILITY, tileKey } from '../systems/abilities.js'
import { TILE } from '../levels/parseRoom.js'

/**
 * What the abilities reveal, drawn over the room's tiles: with the PKE
 * Meter, a faint shimmer where spectral walls stood and cracks on weak
 * floors; always, a pulsing glow over ectoplasm barriers. Also plays the
 * dust burst when a weak floor crumbles.
 */
export class GateOverlay {
  constructor(scene, room, abilities, broken) {
    this.time = 0
    const pke = abilities.has(ABILITY.PKE)
    const s = TILE_SIZE

    this.spectral = scene.add.graphics().setDepth(DEPTH.GATES).setBlendMode(Phaser.BlendModes.ADD)
    this.barriers = scene.add.graphics().setDepth(DEPTH.GATES).setBlendMode(Phaser.BlendModes.ADD)
    this.cracks = new Map()
    room.tiles.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile === TILE.SPECTRAL && pke) {
          this.spectral.lineStyle(1, toColor(PALETTE.gates.spectral), 1)
          this.spectral.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1)
          this.spectral.fillStyle(toColor(PALETTE.gates.spectral), 0.4)
          this.spectral.fillRect(x * s + 2, y * s + 2, s - 4, s - 4)
        } else if (tile === TILE.WEAK_FLOOR && pke && !broken.has(tileKey(x, y))) {
          const crack = scene.add
            .image(x * s, y * s, PROGRESSION_TEXTURES.CRACK)
            .setOrigin(0)
            .setAlpha(GATES.CRACK_ALPHA)
            .setDepth(DEPTH.GATES)
          this.cracks.set(tileKey(x, y), crack)
        } else if (tile === TILE.BARRIER) {
          this.barriers.fillStyle(toColor(PALETTE.gates.barrierCore), 1)
          this.barriers.fillRect(x * s - 1, y * s, s + 2, s)
        }
      }),
    )

    this.dust = scene.add.particles(0, 0, COMBAT_TEXTURES.SPARK, {
      emitting: false,
      lifespan: GATES.CRUMBLE_LIFETIME * 1000,
      speed: { min: GATES.CRUMBLE_SPEED / 3, max: GATES.CRUMBLE_SPEED },
      angle: { min: 200, max: 340 },
      gravityY: GATES.CRUMBLE_SPEED * 4,
      tint: toColor(PALETTE.gates.dust),
      alpha: { start: 1, end: 0 },
    })
    this.dust.setDepth(DEPTH.GATES)
    this.update(0)
  }

  update(dt) {
    this.time += dt
    const shimmer = 1 + Math.sin(this.time * GATES.SPECTRAL_FLICKER_SPEED) * GATES.SPECTRAL_FLICKER_AMOUNT
    this.spectral.setAlpha(GATES.SPECTRAL_ALPHA * shimmer)
    const pulse = 1 + Math.sin(this.time * GATES.BARRIER_PULSE_SPEED) * GATES.BARRIER_PULSE_AMOUNT
    this.barriers.setAlpha(GATES.BARRIER_GLOW_ALPHA * pulse)
  }

  /** A weak floor gave way: drop its cracks and kick up dust. */
  crumble(cells) {
    for (const { x, y } of cells) {
      this.cracks.get(tileKey(x, y))?.destroy()
      this.cracks.delete(tileKey(x, y))
      this.dust.explode(GATES.CRUMBLE_PARTICLES, (x + 0.5) * TILE_SIZE, y * TILE_SIZE)
    }
  }
}
