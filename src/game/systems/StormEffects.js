import Phaser from 'phaser'
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, STORM } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { PALETTE } from '../art/palette.js'
import { boltPath, createStorm, flashAlpha, stepStorm } from './stormTiming.js'

/**
 * The storm over Spook Central: slanted rain across the screen, lightning
 * bolts in the sky behind the skyline, and the white flash that lights up
 * everything when one strikes. Timing lives in systems/stormTiming.js.
 */
export class StormEffects {
  constructor(scene, rng = Math.random) {
    this.rng = rng
    this.storm = createStorm(STORM)
    this.bolt = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.SKY_BOLT).setBlendMode(Phaser.BlendModes.ADD)
    this.flash = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, toColor(PALETTE.storm.flash))
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.FLASH)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0)
    this.rain = scene.add.particles(0, 0, ATMOSPHERE_TEXTURES.RAIN, {
      x: { min: 0, max: GAME_WIDTH - STORM.RAIN_SPEED_X * STORM.RAIN_LIFETIME },
      y: { min: -GAME_HEIGHT * 0.2, max: GAME_HEIGHT * 0.3 },
      lifespan: STORM.RAIN_LIFETIME * 1000,
      speedX: STORM.RAIN_SPEED_X,
      speedY: { min: STORM.RAIN_SPEED_Y * 0.85, max: STORM.RAIN_SPEED_Y },
      alpha: { min: STORM.RAIN_ALPHA * 0.5, max: STORM.RAIN_ALPHA },
      tint: toColor(PALETTE.storm.rain),
      frequency: STORM.RAIN_INTERVAL * 1000,
    })
    this.rain.setScrollFactor(0).setDepth(DEPTH.RAIN)
    this.rain.fastForward(STORM.RAIN_LIFETIME * 1000)
  }

  update(dt) {
    if (stepStorm(this.storm, dt, this.rng, STORM)) this.strike()
    const t = this.storm.sinceStrike
    this.flash.setAlpha(flashAlpha(t, STORM))
    this.bolt.setAlpha(Math.max(0, 1 - t / STORM.BOLT_TIME))
  }

  strike() {
    const x = STORM.BOLT_MARGIN + this.rng() * (GAME_WIDTH - STORM.BOLT_MARGIN * 2)
    const { main, branch } = boltPath(this.rng, x, 0, GAME_HEIGHT * STORM.BOLT_BOTTOM, STORM)
    const g = this.bolt
    g.clear()
    const stroke = (points, width, color, alpha) => {
      g.lineStyle(width, color, alpha)
      g.beginPath()
      g.moveTo(points[0], points[1])
      for (let i = 2; i < points.length; i += 2) g.lineTo(points[i], points[i + 1])
      g.strokePath()
    }
    stroke(main, STORM.BOLT_WIDTH, toColor(PALETTE.storm.bolt), STORM.BOLT_HALO_ALPHA)
    stroke(main, 1, toColor(PALETTE.storm.boltCore), 1)
    if (branch) stroke(branch, 1, toColor(PALETTE.storm.bolt), STORM.BOLT_BRANCH_ALPHA)
  }
}
