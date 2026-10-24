import Phaser from 'phaser'
import { ATMOSPHERE, DEPTH, GAME_HEIGHT } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { PALETTE } from '../art/palette.js'
import { dustCount } from './dustCount.js'
import { ParallaxLayer } from './ParallaxLayer.js'

/**
 * Screen-wide atmosphere for a room: fog banks drifting along the floor (one
 * behind the room, one in front), floating dust or spores, a vignette, and
 * the puffs of dust the player kicks up. `palette` is the area's palette.
 */
export class Atmosphere {
  constructor(scene, { width, height }, palette, { dust = true } = {}) {
    const maxScrollY = Math.max(0, height - GAME_HEIGHT)
    const fog = (depth, factor, alpha) =>
      new ParallaxLayer(
        scene,
        {
          key: ATMOSPHERE_TEXTURES.FOG,
          factorX: factor,
          factorY: 1,
          width: ATMOSPHERE.FOG_PERIOD,
          height: ATMOSPHERE.FOG_HEIGHT,
          anchor: 'bottom',
          depth,
        },
        maxScrollY,
        { tint: toColor(palette.fog), alpha, blendMode: Phaser.BlendModes.ADD },
      )
    this.fogBack = fog(DEPTH.FOG_BACK, ATMOSPHERE.FOG_BACK_FACTOR, ATMOSPHERE.FOG_BACK_ALPHA)
    this.fogFront = fog(DEPTH.FOG, ATMOSPHERE.FOG_FRONT_FACTOR, ATMOSPHERE.FOG_ALPHA)
    this.time = 0

    this.vignette = scene.add
      .image(0, 0, ATMOSPHERE_TEXTURES.VIGNETTE)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.VIGNETTE)
      .setAlpha(ATMOSPHERE.VIGNETTE_ALPHA)

    this.dust = dust ? this.createDust(scene, width, height, palette) : null
    this.puffs = scene.add.particles(0, 0, ATMOSPHERE_TEXTURES.MOTE, {
      emitting: false,
      lifespan: ATMOSPHERE.PUFF_LIFETIME * 1000,
      speed: { min: ATMOSPHERE.PUFF_SPEED / 3, max: ATMOSPHERE.PUFF_SPEED },
      angle: { min: 190, max: 350 },
      alpha: { start: ATMOSPHERE.PUFF_ALPHA, end: 0 },
      scale: { start: 1, end: ATMOSPHERE.PUFF_END_SCALE },
      tint: toColor(PALETTE.atmosphere.dust),
    })
    this.puffs.setDepth(DEPTH.PLAYER + 1)
  }

  createDust(scene, width, height, palette) {
    const count = dustCount(width, height, ATMOSPHERE)
    const lifespan = ATMOSPHERE.DUST_LIFETIME * 1000
    const emitter = scene.add.particles(0, 0, ATMOSPHERE_TEXTURES.MOTE, {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan,
      speedX: { min: -ATMOSPHERE.DUST_DRIFT, max: ATMOSPHERE.DUST_DRIFT },
      speedY: { min: -ATMOSPHERE.DUST_RISE, max: ATMOSPHERE.DUST_RISE / 3 },
      scale: { min: ATMOSPHERE.DUST_MIN_SCALE, max: 1 },
      // Fade in and out over each mote's life.
      alpha: { onEmit: () => 0, onUpdate: (_p, _key, t) => Math.sin(t * Math.PI) * ATMOSPHERE.DUST_ALPHA },
      tint: toColor(palette.mote),
      blendMode: Phaser.BlendModes.ADD,
      frequency: lifespan / count,
      maxAliveParticles: count,
    })
    emitter.setDepth(DEPTH.DUST)
    // Start with the room already full of dust.
    emitter.fastForward(lifespan)
    return emitter
  }

  /** A little dust where the player's feet hit the floor. */
  puff(x, y, count = ATMOSPHERE.PUFF_COUNT) {
    this.puffs.explode(count, x, y)
  }

  update(dt, camera) {
    this.time += dt
    const drift = this.time * ATMOSPHERE.FOG_DRIFT_SPEED
    this.fogBack.update(camera, -drift)
    this.fogFront.update(camera, drift)
  }
}
