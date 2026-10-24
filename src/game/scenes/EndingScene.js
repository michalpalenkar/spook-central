import Phaser from 'phaser'
import { ATMOSPHERE, DEPTH, ENDING, GAME_HEIGHT, GAME_WIDTH, MAX_FRAME_DELTA } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { Scenery } from '../systems/Scenery.js'

const ENDING_ROOM = { area: 'rooftop', outdoor: true }

/**
 * Behind the ending text (ui/Menus.jsx): the storm is over, dawn glows on
 * the horizon and what's left of the mascot drifts down over the city as
 * marshmallow puffs.
 */
export class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending')
  }

  create() {
    this.scenery = new Scenery(this, ENDING_ROOM, GAME_HEIGHT)
    // Sunrise: a wide warm glow on the horizon, behind the skyline.
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT * ENDING.DAWN_Y, ATMOSPHERE_TEXTURES.LIGHT)
      .setScrollFactor(0)
      .setScale((GAME_WIDTH * ENDING.DAWN_WIDTH) / ATMOSPHERE.LIGHT_SIZE, (GAME_HEIGHT * ENDING.DAWN_HEIGHT) / ATMOSPHERE.LIGHT_SIZE)
      .setTint(toColor(PALETTE.ending.dawn))
      .setAlpha(ENDING.DAWN_ALPHA)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.SKY_BOLT)

    this.puffs = this.add.particles(0, 0, PROGRESSION_TEXTURES.GLOB, {
      x: { min: 0, max: GAME_WIDTH },
      y: -ENDING.PUFF_SPAWN_ABOVE,
      lifespan: ENDING.PUFF_LIFETIME * 1000,
      frequency: ENDING.PUFF_INTERVAL * 1000,
      speedY: { min: ENDING.PUFF_SPEED_Y * 0.6, max: ENDING.PUFF_SPEED_Y },
      speedX: { min: -ENDING.PUFF_SWAY, max: ENDING.PUFF_SWAY },
      scale: { min: ENDING.PUFF_SCALE_MIN, max: ENDING.PUFF_SCALE_MAX },
      alpha: { start: ENDING.PUFF_ALPHA, end: 0 },
      rotate: { min: 0, max: 360 },
      tint: toColor(PALETTE.ending.puff),
    })
    this.puffs.setScrollFactor(0).setDepth(DEPTH.FOG)
    this.puffs.fastForward(ENDING.PUFF_LIFETIME * 1000)
    this.add.image(0, 0, ATMOSPHERE_TEXTURES.VIGNETTE).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.VIGNETTE)
    this.cameras.main.setScroll(0, 0).fadeIn(ENDING.FADE_TIME * 1000)
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, MAX_FRAME_DELTA)
    const camera = this.cameras.main
    camera.scrollX += ENDING.PAN_SPEED * dt
    this.scenery.update(camera)
  }
}
