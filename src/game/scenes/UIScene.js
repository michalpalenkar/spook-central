import Phaser from 'phaser'
import { HUD } from '../constants.js'
import { ATMOSPHERE_TEXTURES } from '../art/atmosphereTextures.js'
import { toColor } from '../art/color.js'
import { COMBAT_TEXTURES } from '../art/combatTextures.js'
import { CELL_HEIGHT, CELL_WIDTH, DIGIT_HEIGHT, DIGIT_WIDTH, toDigits } from '../art/hudGlyphs.js'
import { PALETTE } from '../art/palette.js'
import { PROGRESSION_TEXTURES } from '../art/progressionTextures.js'
import { ABILITY_IDS } from '../systems/abilities.js'

// Registry keys the World scene writes and the HUD reads.
export const HUD_KEYS = {
  HP: 'hp',
  MAX_HP: 'maxHp',
  ESSENCE: 'essence',
  // Owned ability ids, comma-joined (a string, so changes are cheap to spot).
  ABILITIES: 'abilities',
}

/**
 * The HUD, drawn above the world in its own scene so camera shake and
 * scrolling never touch it: mask-shaped proton-pack battery cells for HP,
 * an ecto-essence counter, and the relics of the abilities owned, on a soft
 * dark plate between two thin ornamental rules.
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
    this.plateFor = null

    // The plate: a soft shadow, a rule above the cells (diamond to scroll)
    // and a shorter one under the counter.
    this.shadow = this.add.image(0, 0, ATMOSPHERE_TEXTURES.LIGHT).setOrigin(0).setTint(toColor(PALETTE.hud.plate))
    this.rules = this.add.graphics()
    this.diamond = this.add.image(0, 0, ATMOSPHERE_TEXTURES.HUD_DIAMOND).setOrigin(0.5)
    this.scroll = this.add.image(0, 0, ATMOSPHERE_TEXTURES.HUD_SCROLL).setOrigin(0, 0.5)

    const cellsTop = HUD.MARGIN_Y
    const essenceY = cellsTop + CELL_HEIGHT + HUD.ESSENCE_GAP
    this.essenceIcon = this.add.image(HUD.MARGIN_X, essenceY, COMBAT_TEXTURES.HUD_ORB).setOrigin(0, 0.5)
    this.digitsX = HUD.MARGIN_X + this.essenceIcon.width + HUD.ESSENCE_GAP / 2
    this.digitsY = essenceY
    const abilitiesY = essenceY + HUD.ABILITY_ROW_GAP
    this.abilityIcons = ABILITY_IDS.map((id, i) =>
      this.add
        .image(HUD.MARGIN_X + i * HUD.ABILITY_SPACING, abilitiesY, PROGRESSION_TEXTURES.RELIC, id)
        .setOrigin(0, 0.5)
        .setScale(HUD.ABILITY_SCALE)
        .setVisible(false),
    )

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
    this.drawPlate(maxHp)
    this.drawCells()
    this.drawEssence(this.registry.get(HUD_KEYS.ESSENCE) ?? 0)
    this.drawAbilities(this.registry.get(HUD_KEYS.ABILITIES) ?? '')
  }

  drawPlate(maxHp) {
    if (this.plateFor === maxHp) return
    this.plateFor = maxHp
    const { MARGIN_X, MARGIN_Y, PIP_SPACING, PLATE_PADDING_X: padX, PLATE_PADDING_Y: padY } = HUD
    const cellsWidth = maxHp * (CELL_WIDTH + PIP_SPACING) - PIP_SPACING
    const left = MARGIN_X - padX
    const top = MARGIN_Y - padY
    const width = cellsWidth + padX * 2
    const bottom = this.digitsY + (DIGIT_HEIGHT * HUD.DIGIT_SCALE) / 2 + padY
    const shadowSize = this.shadow.width
    this.shadow
      .setPosition(left - padX * 2, top - padY * 2)
      .setScale((width + padX * 4) / shadowSize, (bottom - top + padY * 4) / shadowSize)
      .setAlpha(HUD.PLATE_ALPHA)

    const g = this.rules.clear()
    g.fillStyle(toColor(PALETTE.hud.ornament), 1)
    g.fillRect(left + this.diamond.width / 2, top, width - this.diamond.width / 2, 1)
    g.fillStyle(toColor(PALETTE.hud.ornamentShade), 1)
    g.fillRect(left + this.diamond.width / 2, top + 1, width - this.diamond.width / 2, 1)
    g.fillRect(left, bottom, width / 2, 1)
    this.diamond.setPosition(left, top)
    this.scroll.setPosition(left + width, top + 1)
  }

  // Owned abilities sit in a row in a fixed order, packed left.
  drawAbilities(list) {
    const owned = new Set(list.split(',').filter(Boolean))
    let slot = 0
    ABILITY_IDS.forEach((id, i) => {
      const icon = this.abilityIcons[i]
      icon.setVisible(owned.has(id))
      if (owned.has(id)) icon.setX(HUD.MARGIN_X + slot++ * HUD.ABILITY_SPACING)
    })
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
