import { FIRE_POLE, GAME_HEIGHT, GAME_WIDTH, PLAYER_FEEL, TILE_SIZE } from '../constants.js'
import { BARRIER_FRAME, EDGE, PLATFORM_FRAME, SLIME_FRAME_START, SOLID_FRAME_COUNT, TILESET_FRAME_COUNT } from '../levels/autotile.js'
import { generateAtmosphereTextures } from './atmosphereTextures.js'
import { generateCombatTextures } from './combatTextures.js'
import { drawPixelRows } from './drawPixelRows.js'
import { PALETTE } from './palette.js'
import { generateProgressionTextures } from './progressionTextures.js'
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, PLAYER_FRAMES } from './playerFrames.js'
import { generateSceneryTextures } from './sceneryTextures.js'

export const TEXTURES = {
  PLAYER: 'player',
  POLE: 'fire-pole',
}

// Each area draws its backdrop and tiles in its own palette.
const AREA_PALETTES = {
  firehouse: PALETTE.firehouse,
  library: PALETTE.library,
  hotel: PALETTE.hotel,
  rooftop: PALETTE.rooftop,
}

export const DEFAULT_AREA = 'firehouse'

/** Texture keys for an area's backdrop and tileset. */
export function areaTextures(area) {
  const key = AREA_PALETTES[area] ? area : DEFAULT_AREA
  return { backdrop: `backdrop-${key}`, tiles: `tiles-${key}` }
}

export const PLAYER_ANIMS = {
  IDLE: 'player-idle',
  RUN: 'player-run',
  JUMP: 'player-jump',
  FALL: 'player-fall',
}

/** Draws every texture the game uses. Nothing is loaded from disk. */
export function generateTextures(scene) {
  for (const [area, palette] of Object.entries(AREA_PALETTES)) {
    const keys = areaTextures(area)
    generateBackdrop(scene, keys.backdrop, palette)
    generateTiles(scene, keys.tiles, palette)
  }
  generatePlayer(scene)
  generatePole(scene)
  generateCombatTextures(scene)
  generateProgressionTextures(scene)
  generateSceneryTextures(scene)
  generateAtmosphereTextures(scene)
}

function generateBackdrop(scene, key, palette) {
  const texture = scene.textures.createCanvas(key, GAME_WIDTH, GAME_HEIGHT)
  const ctx = texture.context
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, palette.skyTop)
  gradient.addColorStop(1, palette.skyBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  texture.refresh()
}

function generateTiles(scene, key, palette) {
  const texture = scene.textures.createCanvas(key, TILE_SIZE * TILESET_FRAME_COUNT, TILE_SIZE)
  const ctx = texture.context
  for (let mask = 0; mask < SOLID_FRAME_COUNT; mask++) {
    drawSolidTile(ctx, mask * TILE_SIZE, mask, palette)
    const slimeX = (SLIME_FRAME_START + mask) * TILE_SIZE
    drawSolidTile(ctx, slimeX, mask, palette)
    drawSlime(ctx, slimeX, mask, PALETTE.gates)
  }
  drawPlatformTile(ctx, PLATFORM_FRAME * TILE_SIZE, palette)
  drawBarrierTile(ctx, BARRIER_FRAME * TILE_SIZE, PALETTE.gates)
  texture.refresh()
}

// Green slime coating the faces of a wall that are open to the air, with
// drips running down the sides.
function drawSlime(ctx, ox, mask, c) {
  const s = TILE_SIZE
  const fill = (color, x, y, w, h) => {
    ctx.fillStyle = color
    ctx.fillRect(ox + x, y, w, h)
  }
  // A faint film over the whole face, so slimed walls read even inside a mass.
  ctx.globalAlpha = 0.35
  fill(c.slimeDark, 0, 0, s, s)
  ctx.globalAlpha = 1
  const drips = [2, 5, 9, 12, 7, 4]
  if (mask & EDGE.LEFT) {
    fill(c.slime, 0, 0, 3, s)
    fill(c.slimeShine, 0, 2, 1, 5)
    drips.slice(0, 3).forEach((len, i) => fill(c.slime, 3, i * 5 + 1, 1, Math.min(len, 4)))
  }
  if (mask & EDGE.RIGHT) {
    fill(c.slime, s - 3, 0, 3, s)
    fill(c.slimeShine, s - 1, 7, 1, 5)
    drips.slice(3).forEach((len, i) => fill(c.slime, s - 4, i * 5 + 3, 1, Math.min(len, 4)))
  }
  if (mask & EDGE.TOP) {
    fill(c.slime, 0, 0, s, 2)
    drips.forEach((len, i) => fill(c.slimeDark, 1 + i * 3, 2, 1, Math.min(len, 5)))
  }
  if (mask & EDGE.BOTTOM) {
    fill(c.slime, 0, s - 2, s, 2)
    fill(c.slime, 4, s - 3, 2, 1)
    fill(c.slime, 11, s - 3, 1, 1)
  }
}

// A translucent wall of ectoplasm with brighter swirls. Its glow is added
// by the gate overlay at runtime.
function drawBarrierTile(ctx, ox, c) {
  const s = TILE_SIZE
  ctx.globalAlpha = 0.55
  ctx.fillStyle = c.barrier
  ctx.fillRect(ox, 0, s, s)
  ctx.globalAlpha = 0.8
  ctx.fillStyle = c.barrierCore
  for (let y = 0; y < s; y++) {
    // Two wavy strands per tile, continuous from tile to tile.
    const a = Math.round(4 + Math.sin((y / s) * Math.PI * 2) * 3)
    const b = Math.round(11 + Math.cos((y / s) * Math.PI * 2) * 3)
    ctx.fillRect(ox + a, y, 1, 1)
    ctx.fillRect(ox + b, y, 1, 1)
  }
  ctx.globalAlpha = 1
  ctx.fillStyle = c.barrierShine
  ctx.fillRect(ox + 7, 3, 1, 1)
  ctx.fillRect(ox + 3, 12, 1, 1)
}

// Brick wall, dark inside, with thin pale highlights on edges facing open air.
function drawSolidTile(ctx, ox, mask, c) {
  const s = TILE_SIZE
  const half = s / 2
  const fill = (color, x, y, w, h) => {
    ctx.fillStyle = color
    ctx.fillRect(ox + x, y, w, h)
  }

  fill(mask === 0 ? c.brickInterior : c.brick, 0, 0, s, s)
  fill(c.mortar, 0, half - 1, s, 1)
  fill(c.mortar, 0, s - 1, s, 1)
  fill(c.mortar, s - 5, 0, 1, half - 1)
  fill(c.mortar, 3, half, 1, half - 1)

  if (mask & EDGE.LEFT) fill(c.edgeMid, 0, 0, 1, s)
  if (mask & EDGE.RIGHT) fill(c.edgeMid, s - 1, 0, 1, s)
  if (mask & EDGE.BOTTOM) fill(c.edgeShadow, 0, s - 1, s, 1)
  if (mask & EDGE.TOP) {
    fill(c.edgeHighlight, 0, 0, s, 1)
    fill(c.edgeMid, 0, 1, s, 1)
  }
}

// Wooden plank with two brackets underneath.
function drawPlatformTile(ctx, ox, c) {
  const fill = (color, x, y, w, h) => {
    ctx.fillStyle = color
    ctx.fillRect(ox + x, y, w, h)
  }
  fill(c.plankHighlight, 0, 0, TILE_SIZE, 1)
  fill(c.plank, 0, 1, TILE_SIZE, 3)
  fill(c.plankShadow, 0, 4, TILE_SIZE, 1)
  fill(c.plankShadow, 3, 5, 2, 3)
  fill(c.plankShadow, 11, 5, 2, 3)
}

// One tile of brass fire pole, tiled vertically: a rounded rod with a bright
// highlight down one side and a band every tile.
function generatePole(scene) {
  const c = PALETTE.pole
  const w = FIRE_POLE.WIDTH
  const texture = scene.textures.createCanvas(TEXTURES.POLE, w, TILE_SIZE)
  const ctx = texture.context
  const fill = (color, x, y, width, height) => {
    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)
  }
  fill(c.brass, 0, 0, w, TILE_SIZE)
  fill(c.shadow, w - 1, 0, 1, TILE_SIZE)
  fill(c.highlight, 1, 0, 1, TILE_SIZE)
  fill(c.shadow, 0, TILE_SIZE - 1, w, 1)
  texture.refresh()
}

function generatePlayer(scene) {
  const names = Object.keys(PLAYER_FRAMES)
  const texture = scene.textures.createCanvas(
    TEXTURES.PLAYER,
    PLAYER_FRAME_WIDTH * names.length,
    PLAYER_FRAME_HEIGHT,
  )
  names.forEach((name, i) => {
    const ox = i * PLAYER_FRAME_WIDTH
    drawPixelRows(texture.context, PLAYER_FRAMES[name], PALETTE.player, ox, 0)
    texture.add(name, 0, ox, 0, PLAYER_FRAME_WIDTH, PLAYER_FRAME_HEIGHT)
  })
  texture.refresh()

  const anim = (key, frames, frameRate = 1) =>
    scene.anims.create({
      key,
      frames: frames.map((frame) => ({ key: TEXTURES.PLAYER, frame })),
      frameRate,
      repeat: -1,
    })
  anim(PLAYER_ANIMS.IDLE, ['idle'])
  anim(PLAYER_ANIMS.RUN, ['run0', 'run1'], PLAYER_FEEL.RUN_ANIM_FPS)
  anim(PLAYER_ANIMS.JUMP, ['jump'])
  anim(PLAYER_ANIMS.FALL, ['fall'])
}
