import { GAME_HEIGHT, GAME_WIDTH, PLAYER_FEEL, TILE_SIZE } from '../constants.js'
import { EDGE, PLATFORM_FRAME, SOLID_FRAME_COUNT } from '../levels/autotile.js'
import { PALETTE } from './palette.js'
import { PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, PLAYER_FRAMES } from './playerFrames.js'

export const TEXTURES = {
  BACKDROP: 'backdrop',
  TILES: 'tiles',
  PLAYER: 'player',
}

export const PLAYER_ANIMS = {
  IDLE: 'player-idle',
  RUN: 'player-run',
  JUMP: 'player-jump',
  FALL: 'player-fall',
}

/** Draws every texture the game uses. Nothing is loaded from disk. */
export function generateTextures(scene) {
  generateBackdrop(scene)
  generateTiles(scene)
  generatePlayer(scene)
}

function generateBackdrop(scene) {
  const texture = scene.textures.createCanvas(TEXTURES.BACKDROP, GAME_WIDTH, GAME_HEIGHT)
  const ctx = texture.context
  const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT)
  gradient.addColorStop(0, PALETTE.firehouse.skyTop)
  gradient.addColorStop(1, PALETTE.firehouse.skyBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT)
  texture.refresh()
}

function generateTiles(scene) {
  const frameCount = PLATFORM_FRAME + 1
  const texture = scene.textures.createCanvas(TEXTURES.TILES, TILE_SIZE * frameCount, TILE_SIZE)
  const ctx = texture.context
  for (let mask = 0; mask < SOLID_FRAME_COUNT; mask++) drawSolidTile(ctx, mask * TILE_SIZE, mask)
  drawPlatformTile(ctx, PLATFORM_FRAME * TILE_SIZE)
  texture.refresh()
}

// Brick wall, dark inside, with thin pale highlights on edges facing open air.
function drawSolidTile(ctx, ox, mask) {
  const c = PALETTE.firehouse
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
function drawPlatformTile(ctx, ox) {
  const c = PALETTE.firehouse
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

function drawPixelRows(ctx, rows, colors, ox, oy) {
  rows.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      if (char === '.') return
      ctx.fillStyle = colors[char]
      ctx.fillRect(ox + x, oy + y, 1, 1)
    })
  })
}
