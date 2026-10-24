import Phaser from 'phaser'
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, MAX_FRAME_DELTA, TITLE } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES, GHOST_ANIMS } from '../art/combatTextures.js'
import { PALETTE } from '../art/palette.js'
import { Scenery } from '../systems/Scenery.js'
import { StormEffects } from '../systems/StormEffects.js'

// The title screen's backdrop is Spook Central's own rooftop.
const TITLE_ROOM = { area: 'rooftop', outdoor: true }

/**
 * Behind the title menu (an HTML overlay, ui/Menus.jsx): a slow pan along
 * the rooftop skyline in the storm, with a ghost drifting between the
 * towers. Thunder comes from the shared AudioEngine.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title')
  }

  create() {
    const audio = this.registry.get('audio')
    this.scenery = new Scenery(this, TITLE_ROOM, GAME_HEIGHT)
    this.storm = new StormEffects(this, { onStrike: () => audio?.thunder() })
    this.add.image(0, 0, ATMOSPHERE_TEXTURES.VIGNETTE).setOrigin(0).setScrollFactor(0).setDepth(DEPTH.VIGNETTE)

    // Between the far skyline and the temple towers, so it slips behind them.
    const depth = (DEPTH.SCENERY_FAR + DEPTH.SCENERY_MID) / 2
    this.glow = this.add
      .image(0, 0, COMBAT_TEXTURES.GLOW)
      .setScrollFactor(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(toColor(PALETTE.title.glow))
      .setScale(TITLE.GHOST_GLOW_SCALE)
      .setAlpha(TITLE.GHOST_GLOW_ALPHA)
      .setDepth(depth)
    this.ghost = this.add
      .sprite(0, 0, COMBAT_TEXTURES.GHOST, 'sway0')
      .setScrollFactor(0)
      .setTint(toColor(PALETTE.title.ghost))
      .setAlpha(TITLE.GHOST_ALPHA)
      .setDepth(depth)
      .setFlipX(true)
    this.ghost.play(GHOST_ANIMS.FLOAT)
    this.ghostX = GAME_WIDTH * TITLE.GHOST_START_X
    this.time0 = 0
    this.cameras.main.setScroll(0, 0)
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, MAX_FRAME_DELTA)
    this.time0 += dt
    const camera = this.cameras.main
    camera.scrollX += TITLE.PAN_SPEED * dt
    this.scenery.update(camera)
    this.storm.update(dt)

    // Drifts left across the upper sky and comes round again.
    const margin = this.ghost.width * TITLE.GHOST_GLOW_SCALE
    this.ghostX -= TITLE.GHOST_SPEED * dt
    if (this.ghostX < -margin) this.ghostX = GAME_WIDTH + margin
    const y = GAME_HEIGHT * TITLE.GHOST_Y + Math.sin(this.time0 * TITLE.GHOST_BOB_SPEED) * TITLE.GHOST_BOB
    this.ghost.setPosition(this.ghostX, y)
    this.glow.setPosition(this.ghostX, y)
  }
}
