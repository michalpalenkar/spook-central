import { ESSENCE } from '../constants.js'
import { PALETTE } from './palette.js'
import { drawPixelRows } from './drawPixelRows.js'
import { GHOST_FRAME_HEIGHT, GHOST_FRAME_WIDTH, GHOST_FRAMES } from './ghostFrames.js'
import { CELL_FRAMES, CELL_HEIGHT, CELL_WIDTH, DIGIT_HEIGHT, DIGIT_WIDTH, DIGITS } from './hudGlyphs.js'
import { TRAP_FRAME_HEIGHT, TRAP_FRAME_WIDTH, TRAP_FRAMES } from './trapFrames.js'

export const COMBAT_TEXTURES = {
  GHOST: 'ghost',
  GLOW: 'glow',
  SPARK: 'spark',
  ORB: 'essence-orb',
  TRAP: 'trap',
  HUD_CELL: 'hud-cell',
  HUD_DIGITS: 'hud-digits',
  HUD_ORB: 'hud-orb',
}

export const GHOST_ANIMS = {
  FLOAT: 'ghost-float',
}

// Size of the soft radial glow texture; sprites scale it as needed.
const GLOW_SIZE = 32
const SPARK_SIZE = 2
const HUD_ORB_SIZE = 7
const GHOST_ANIM_FPS = 5

const GHOST_COLORS = {
  r: PALETTE.ghost.rim,
  b: PALETTE.ghost.body,
  s: PALETTE.ghost.bodyShade,
  e: PALETTE.ghost.eyes,
}

/** Ghost, trap, essence and HUD textures. Everything is drawn in code. */
export function generateCombatTextures(scene) {
  generateFramedTexture(scene, COMBAT_TEXTURES.GHOST, GHOST_FRAMES, GHOST_COLORS, GHOST_FRAME_WIDTH, GHOST_FRAME_HEIGHT)
  scene.anims.create({
    key: GHOST_ANIMS.FLOAT,
    frames: Object.keys(GHOST_FRAMES).map((frame) => ({ key: COMBAT_TEXTURES.GHOST, frame })),
    frameRate: GHOST_ANIM_FPS,
    repeat: -1,
  })

  const trapColors = {
    s: PALETTE.trap.shell,
    h: PALETTE.trap.shellHighlight,
    y: PALETTE.trap.stripe,
    p: PALETTE.trap.pedal,
  }
  generateFramedTexture(
    scene,
    COMBAT_TEXTURES.TRAP,
    {
      closed: TRAP_FRAMES.closed,
      open: TRAP_FRAMES.open,
    },
    { ...trapColors, l: PALETTE.trap.light },
    TRAP_FRAME_WIDTH,
    TRAP_FRAME_HEIGHT,
    // The open trap's light turns green: it is armed.
    { open: { ...trapColors, l: PALETTE.trap.lightArmed } },
  )

  generateGlow(scene)
  generateDisc(scene, COMBAT_TEXTURES.SPARK, SPARK_SIZE, PALETTE.stream.spark, PALETTE.stream.spark)
  generateDisc(scene, COMBAT_TEXTURES.ORB, ESSENCE.ORB_SIZE, PALETTE.essence.core, PALETTE.essence.glow)
  generateDisc(scene, COMBAT_TEXTURES.HUD_ORB, HUD_ORB_SIZE, PALETTE.essence.core, PALETTE.essence.glow)

  generateFramedTexture(scene, COMBAT_TEXTURES.HUD_CELL, CELL_FRAMES, cellColors(), CELL_WIDTH, CELL_HEIGHT, {
    flash: cellColors(PALETTE.hud.cellFlash),
  }, { flash: CELL_FRAMES.full })

  const digitFrames = Object.fromEntries(DIGITS.map((rows, i) => [String(i), rows]))
  generateFramedTexture(scene, COMBAT_TEXTURES.HUD_DIGITS, digitFrames, { '#': PALETTE.hud.digit }, DIGIT_WIDTH, DIGIT_HEIGHT)
}

function cellColors(charge) {
  return {
    f: PALETTE.hud.frame,
    d: PALETTE.hud.frameShadow,
    c: charge ?? PALETTE.hud.cellFull,
    k: charge ?? PALETTE.hud.cellCore,
    e: PALETTE.hud.cellEmpty,
  }
}

/**
 * Lays pixel-row frames side by side in one canvas texture and registers
 * each as a named frame. `colorOverrides` swaps the palette per frame and
 * `extraFrames` adds frames that reuse other rows.
 */
export function generateFramedTexture(scene, key, frames, colors, width, height, colorOverrides = {}, extraFrames = {}) {
  const all = { ...frames, ...extraFrames }
  const names = Object.keys(all)
  const texture = scene.textures.createCanvas(key, width * names.length, height)
  names.forEach((name, i) => {
    const ox = i * width
    drawPixelRows(texture.context, all[name], colorOverrides[name] ?? colors, ox, 0)
    texture.add(name, 0, ox, 0, width, height)
  })
  texture.refresh()
}

// White radial falloff, tinted and blended additively by whoever uses it.
function generateGlow(scene) {
  const texture = scene.textures.createCanvas(COMBAT_TEXTURES.GLOW, GLOW_SIZE, GLOW_SIZE)
  const ctx = texture.context
  const r = GLOW_SIZE / 2
  const gradient = ctx.createRadialGradient(r, r, 0, r, r, r)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE)
  texture.refresh()
}

// A small pixel disc: bright core, coloured rim.
export function generateDisc(scene, key, size, core, rim) {
  const texture = scene.textures.createCanvas(key, size, size)
  const ctx = texture.context
  const c = (size - 1) / 2
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c)
      if (d > c + 0.5) continue
      ctx.fillStyle = d <= c * 0.5 ? core : rim
      ctx.fillRect(x, y, 1, 1)
    }
  }
  texture.refresh()
}
