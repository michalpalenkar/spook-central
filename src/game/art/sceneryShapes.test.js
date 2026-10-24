import { describe, expect, it } from 'vitest'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.js'
import { ROOMS } from '../levels/world.js'
import { commandBounds } from './paintCommands.js'
import { createRng, seedFrom } from './rng.js'
import { LAYER_KIND, sceneryLayers, sceneryPalette, sceneryVariants } from './scenery.js'
import { paintSky, paintStyle } from './sceneryShapes.js'

const OPS = new Set(['rect', 'poly', 'ellipse', 'ring', 'line', 'vgrad', 'glow'])
const HEX = /^#[0-9a-f]{6}$/

function paint(variant, layer, seed = 1) {
  return paintStyle(layer.style, { width: layer.width, height: layer.height, palette: sceneryPalette(variant), rng: createRng(seed) })
}

function expectValid(commands, width, height) {
  expect(commands.length).toBeGreaterThan(0)
  for (const cmd of commands) {
    expect(OPS.has(cmd.op)).toBe(true)
    for (const key of ['color', 'from', 'to']) if (key in cmd) expect(cmd[key]).toMatch(HEX)
    const b = commandBounds(cmd)
    for (const v of Object.values(b)) expect(Number.isFinite(v)).toBe(true)
    // Shapes may run past an edge (the painter wraps them) but not wildly.
    expect(b.right).toBeGreaterThan(-width)
    expect(b.left).toBeLessThan(width * 2)
    expect(b.bottom).toBeGreaterThan(-height)
    expect(b.top).toBeLessThan(height * 2)
  }
}

const cases = sceneryVariants(ROOMS).flatMap((variant) => sceneryLayers(variant).map((layer) => [layer.key, variant, layer]))

describe('scenery painters', () => {
  it.each(cases)('%s draws valid commands', (_key, variant, layer) => {
    expectValid(paint(variant, layer), layer.width, layer.height)
  })

  it.each(cases)('%s is the same for the same seed', (key, variant, layer) => {
    const seed = seedFrom(key)
    expect(paint(variant, layer, seed)).toEqual(paint(variant, layer, seed))
  })

  it.each(cases.filter(([, , l]) => l.kind === LAYER_KIND.FORE_BOTTOM))('%s leaves most of the width open', (_key, variant, layer) => {
    // Foreground silhouettes pass in front of the player: keep them sparse.
    const covered = new Uint8Array(layer.width)
    for (const cmd of paint(variant, layer)) {
      const b = commandBounds(cmd)
      for (let x = Math.max(0, Math.floor(b.left)); x < Math.min(layer.width, Math.ceil(b.right)); x++) covered[x] = 1
    }
    expect(covered.reduce((a, c) => a + c, 0) / layer.width).toBeLessThan(0.5)
  })

  it('paints a sky for each outdoor variant', () => {
    for (const variant of sceneryVariants(ROOMS).filter((v) => v.outdoor)) {
      const commands = paintSky({ width: GAME_WIDTH, height: GAME_HEIGHT, palette: sceneryPalette(variant), rng: createRng(3) })
      expectValid(commands, GAME_WIDTH, GAME_HEIGHT)
      expect(commands[0]).toMatchObject({ op: 'vgrad', x: 0, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT })
    }
  })

  it('rejects unknown styles', () => {
    expect(() => paintStyle('disco', {})).toThrow(/disco/)
  })
})
