import Phaser from 'phaser'
import { ATMOSPHERE, GAME_HEIGHT, GAME_WIDTH } from '../constants.js'
import { rgba } from './color.js'
import { drawPixelRows } from './drawPixelRows.js'
import { DIAMOND, SCROLL } from './hudGlyphs.js'
import { LAMP_FRAMES, lampSize } from './lampFrames.js'
import { paintCommands } from './paintCommands.js'
import { PALETTE } from './palette.js'
import { createRng, rangeOf } from './rng.js'

export const ATMOSPHERE_TEXTURES = {
  VIGNETTE: 'vignette',
  FOG: 'fog',
  MOTE: 'mote',
  RAIN: 'rain',
  LIGHT: 'light',
  CONE: 'light-cone',
  PIXEL: 'pixel',
  LAMP: 'lamp',
  HUD_DIAMOND: 'hud-diamond',
  HUD_SCROLL: 'hud-scroll',
}

const FOG_SEED = 7
const CONE_WIDTH = 64
const CONE_HEIGHT = 96

/** Vignette, fog, dust, rain, light and lamp textures. White ones are tinted at runtime. */
export function generateAtmosphereTextures(scene) {
  generateVignette(scene)
  generateFog(scene)
  generateLight(scene)
  generateCone(scene)
  generatePixels(scene)
  generateLamps(scene)
  generateHudOrnaments(scene)
}

// Smooth gradients would band at nearest-neighbour scaling; let them filter.
function smooth(scene, key) {
  scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR)
}

// Dark corners and a darker top and bottom, clear in the middle.
function generateVignette(scene) {
  const { VIGNETTE } = ATMOSPHERE_TEXTURES
  const texture = scene.textures.createCanvas(VIGNETTE, GAME_WIDTH, GAME_HEIGHT)
  const ctx = texture.context
  const cx = GAME_WIDTH / 2
  const cy = GAME_HEIGHT / 2
  const outer = Math.hypot(cx, cy)
  const color = PALETTE.atmosphere.vignette
  const radial = ctx.createRadialGradient(cx, cy, outer * ATMOSPHERE.VIGNETTE_INNER, cx, cy, outer)
  radial.addColorStop(0, rgba(color, 0))
  radial.addColorStop(1, rgba(color, 1))
  ctx.fillStyle = radial
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  const band = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  band.addColorStop(0, rgba(color, 0.5))
  band.addColorStop(0.18, rgba(color, 0))
  band.addColorStop(0.85, rgba(color, 0))
  band.addColorStop(1, rgba(color, 0.4))
  ctx.fillStyle = band
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  texture.refresh()
  smooth(scene, VIGNETTE)
}

// A horizontally tileable band of soft wisps, densest at the bottom.
function generateFog(scene) {
  const { FOG } = ATMOSPHERE_TEXTURES
  const width = ATMOSPHERE.FOG_PERIOD
  const height = ATMOSPHERE.FOG_HEIGHT
  const texture = scene.textures.createCanvas(FOG, width, height)
  const ctx = texture.context
  const white = '#ffffff'
  const rng = createRng(FOG_SEED)
  const commands = [{ op: 'vgrad', x: 0, y: 0, w: width, h: height, from: white, to: white, fromAlpha: 0, toAlpha: 0.55 }]
  for (let i = 0; i < 18; i++) {
    commands.push({
      op: 'glow',
      x: rangeOf(rng, 0, width),
      y: rangeOf(rng, height * 0.45, height),
      r: rangeOf(rng, 14, 30),
      color: white,
      alpha: rangeOf(rng, 0.25, 0.5),
    })
  }
  paintCommands(ctx, commands, { width, height })
  texture.refresh()
  smooth(scene, FOG)
}

// Soft white light, falling off with the square of the distance.
function generateLight(scene) {
  const { LIGHT } = ATMOSPHERE_TEXTURES
  const size = ATMOSPHERE.LIGHT_SIZE
  const texture = scene.textures.createCanvas(LIGHT, size, size)
  const ctx = texture.context
  const r = size / 2
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    gradient.addColorStop(t, `rgba(255,255,255,${(1 - t) * (1 - t)})`)
  }
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  texture.refresh()
  smooth(scene, LIGHT)
}

// A downward cone of light, narrow and bright at the top.
function generateCone(scene) {
  const { CONE } = ATMOSPHERE_TEXTURES
  const texture = scene.textures.createCanvas(CONE, CONE_WIDTH, CONE_HEIGHT)
  const ctx = texture.context
  const gradient = ctx.createLinearGradient(0, 0, 0, CONE_HEIGHT)
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.moveTo(CONE_WIDTH / 2 - 4, 0)
  ctx.lineTo(CONE_WIDTH / 2 + 4, 0)
  ctx.lineTo(CONE_WIDTH, CONE_HEIGHT)
  ctx.lineTo(0, CONE_HEIGHT)
  ctx.closePath()
  ctx.fill()
  texture.refresh()
  smooth(scene, CONE)
}

// A dust mote (bright core, faint cross), a slanted rain streak and a plain pixel.
function generatePixels(scene) {
  const mote = scene.textures.createCanvas(ATMOSPHERE_TEXTURES.MOTE, 3, 3)
  drawPixelRows(mote.context, ['.a.', 'aba', '.a.'], { a: 'rgba(255,255,255,0.35)', b: '#ffffff' }, 0, 0)
  mote.refresh()
  const rain = scene.textures.createCanvas(ATMOSPHERE_TEXTURES.RAIN, 3, 8)
  drawPixelRows(rain.context, ['..r', '..r', '.r.', '.r.', '.r.', 'r..', 'r..', 'r..'], { r: '#ffffff' }, 0, 0)
  rain.refresh()
  const pixel = scene.textures.createCanvas(ATMOSPHERE_TEXTURES.PIXEL, 1, 1)
  pixel.context.fillStyle = '#ffffff'
  pixel.context.fillRect(0, 0, 1, 1)
  pixel.refresh()
}

// One frame per area, coloured with that area's palette.
function generateLamps(scene) {
  const areas = Object.keys(LAMP_FRAMES)
  const sizes = areas.map(lampSize)
  const width = sizes.reduce((sum, s) => sum + s.width, 0)
  const height = Math.max(...sizes.map((s) => s.height))
  const texture = scene.textures.createCanvas(ATMOSPHERE_TEXTURES.LAMP, width, height)
  let ox = 0
  areas.forEach((area, i) => {
    const c = PALETTE[area]
    drawPixelRows(texture.context, LAMP_FRAMES[area], { o: c.fore, m: c.midLight, l: c.lamp }, ox, 0)
    texture.add(area, 0, ox, 0, sizes[i].width, sizes[i].height)
    ox += sizes[i].width
  })
  texture.refresh()
}

function generateHudOrnaments(scene) {
  const colors = { o: PALETTE.hud.ornament, s: PALETTE.hud.ornamentShade }
  for (const [key, rows] of [
    [ATMOSPHERE_TEXTURES.HUD_DIAMOND, DIAMOND],
    [ATMOSPHERE_TEXTURES.HUD_SCROLL, SCROLL],
  ]) {
    const texture = scene.textures.createCanvas(key, rows[0].length, rows.length)
    drawPixelRows(texture.context, rows, colors, 0, 0)
    texture.refresh()
  }
}
