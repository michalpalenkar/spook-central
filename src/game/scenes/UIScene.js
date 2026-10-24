import Phaser from 'phaser'
import { HUD } from '../constants.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { CELL_HEIGHT, CELL_WIDTH, DIGIT_WIDTH, toDigits } from '../art/hudGlyphs.js'

// Registry keys the World scene writes and the HUD reads.
export const HUD_KEYS = {
  HP: 'hp',
  MAX_HP: 'maxHp',
  ESSENCE: 'essence',
}

/**
 * The HUD, drawn above the world in its own scene so camera shake and
 * scrolling never touch it: proton-pack battery cells for HP and an
 * ecto-essence counter.
 */
export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI')
  }

  create() {
    this.cells = []
    this.digits = []
    this.flashTimer = 0
    this.lastHp = null

    const cellsTop = HUD.MARGIN_Y
    const essenceY = cellsTop + CELL_HEIGHT + HUD.ESSENCE_GAP
    this.essenceIcon = this.add.image(HUD.MARGIN_X, essenceY, COMBAT_TEXTURES.HUD_ORB).setOrigin(0, 0.5)
    this.digitsX = HUD.MARGIN_X + this.essenceIcon.width + HUD.ESSENCE_GAP / 2
    this.digitsY = essenceY

    this.registry.events.on('changedata', this.refresh, this)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.registry.events.off('changedata', this.refresh, this))
    this.refresh()
  }

  refresh() {
    const hp = this.registry.get(HUD_KEYS.HP) ?? 0
    const maxHp = this.registry.get(HUD_KEYS.MAX_HP) ?? 0
    if (this.lastHp !== null && hp < this.lastHp) this.flashTimer = HUD.HIT_FLASH_TIME
    this.lastHp = hp

    while (this.cells.length < maxHp) {
      const x = HUD.MARGIN_X + this.cells.length * (CELL_WIDTH + HUD.PIP_SPACING)
      this.cells.push(this.add.image(x, HUD.MARGIN_Y, COMBAT_TEXTURES.HUD_CELL, 'full').setOrigin(0))
    }
    this.cells.forEach((cell, i) => cell.setVisible(i < maxHp))
    this.drawCells()
    this.drawEssence(this.registry.get(HUD_KEYS.ESSENCE) ?? 0)
  }

  drawCells() {
    const hp = this.lastHp ?? 0
    const flashing = this.flashTimer > 0
    this.cells.forEach((cell, i) => {
      // The cell just lost flashes white before going dark.
      const frame = i < hp ? 'full' : flashing && i === hp ? 'flash' : 'empty'
      cell.setFrame(frame)
    })
  }

  drawEssence(value) {
    const digits = toDigits(value)
    while (this.digits.length < digits.length) {
      const x = this.digitsX + this.digits.length * (DIGIT_WIDTH * HUD.DIGIT_SCALE + HUD.DIGIT_SPACING)
      this.digits.push(
        this.add.image(x, this.digitsY, COMBAT_TEXTURES.HUD_DIGITS, '0').setOrigin(0, 0.5).setScale(HUD.DIGIT_SCALE),
      )
    }
    this.digits.forEach((image, i) => {
      image.setVisible(i < digits.length)
      if (i < digits.length) image.setFrame(String(digits[i]))
    })
  }

  update(_time, deltaMs) {
    if (this.flashTimer <= 0) return
    this.flashTimer -= deltaMs / 1000
    this.drawCells()
  }
}
