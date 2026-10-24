import { describe, expect, it } from 'vitest'
import { DEPTH } from '../constants.js'
import { ROOMS, getRoom } from '../levels/world.js'
import { PALETTE } from './palette.js'
import { LAYER_KIND, sceneryLayers, sceneryPalette, sceneryVariant, sceneryVariants } from './scenery.js'
import { STYLE_PAINTERS } from './sceneryShapes.js'

const SCENERY_KEYS = ['far', 'farLight', 'window', 'mid', 'midLight', 'fore', 'foreRim', 'fog', 'lamp', 'mote']
const SKY_KEYS = ['top', 'bottom', 'moon', 'moonGlow', 'star', 'cloud', 'cloudLight', 'skyline', 'skylineBack', 'skylineLight', 'skylineWindow']

describe('scenery variants', () => {
  it('opens the Front Steps and the whole rooftop to the sky', () => {
    const outdoor = ROOMS.filter((room) => sceneryVariant(room).outdoor).map((room) => room.id)
    expect(outdoor.sort()).toEqual(['library-steps', 'rooftop-access', 'rooftop-climb', 'rooftop-summit'])
  })

  it('puts the storm only over the rooftop', () => {
    const stormy = ROOMS.filter((room) => sceneryVariant(room).storm).map((room) => room.area)
    expect(new Set(stormy)).toEqual(new Set(['rooftop']))
  })

  it('lists each variant the world uses once', () => {
    const keys = sceneryVariants(ROOMS).map((v) => v.key)
    expect(keys.sort()).toEqual(['firehouse-in', 'hotel-in', 'library-in', 'library-out', 'rooftop-out'])
  })

  it('falls back to the firehouse for rooms without a known area', () => {
    expect(sceneryVariant({ area: null }).key).toBe('firehouse-in')
    expect(sceneryVariant({ area: 'firehouse', outdoor: true }).outdoor).toBe(false)
  })
})

describe('scenery layers', () => {
  const variants = sceneryVariants(ROOMS)

  it.each(variants.map((v) => [v.key, v]))('%s has 3–5 parallax planes, back to front', (_key, variant) => {
    const layers = sceneryLayers(variant)
    // Backdrop + distinct scroll planes + the play layer.
    const planes = new Set(layers.map((l) => l.factorX)).size + 2
    expect(planes).toBeGreaterThanOrEqual(3)
    expect(planes).toBeLessThanOrEqual(5)

    const far = layers.find((l) => l.kind === LAYER_KIND.FAR)
    const mid = layers.find((l) => l.kind === LAYER_KIND.MID)
    const fore = layers.filter((l) => l.kind === LAYER_KIND.FORE_BOTTOM || l.kind === LAYER_KIND.FORE_TOP)
    expect(far.factorX).toBeLessThan(mid.factorX)
    expect(mid.factorX).toBeLessThan(1)
    expect(fore.length).toBeGreaterThan(0)
    for (const f of fore) {
      expect(f.factorX).toBeGreaterThan(1)
      expect(f.depth).toBeGreaterThan(DEPTH.PLAYER)
    }
    expect(far.depth).toBeLessThan(mid.depth)
    expect(mid.depth).toBeLessThan(DEPTH.ROOM)
  })

  it('names a painter for every layer and a unique texture key', () => {
    const keys = new Set()
    for (const variant of variants) {
      for (const layer of sceneryLayers(variant)) {
        expect(STYLE_PAINTERS[layer.style]).toBeTypeOf('function')
        expect(keys.has(layer.key)).toBe(false)
        keys.add(layer.key)
      }
    }
  })

  it('repeats interiors in both directions and anchors outdoor strips', () => {
    const anchors = (key) => sceneryLayers(variants.find((v) => v.key === key)).map((l) => `${l.kind}:${l.anchor}`)
    expect(anchors('library-in')).toContain('far:repeat')
    expect(anchors('library-out')).toContain('far:bottom')
    expect(anchors('library-out')).toContain('foreTop:top')
  })
})

describe('scenery palettes', () => {
  it.each(['firehouse', 'library', 'hotel', 'rooftop'])('%s has every scenery colour', (area) => {
    for (const key of SCENERY_KEYS) expect(PALETTE[area][key]).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('gives outdoor variants a sky', () => {
    const steps = sceneryPalette(sceneryVariant(getRoom('library-steps')))
    for (const key of SKY_KEYS) expect(steps.sky[key]).toMatch(/^#[0-9a-f]{6}$/)
    expect(sceneryPalette(sceneryVariant(getRoom('firehouse-garage'))).sky).toBeNull()
  })

  it('keeps each area in its own hue family', () => {
    // Library cold teal (green ≥ red), hotel crimson (red > blue), rooftop storm purple (blue > green).
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    const [lr, lg] = rgb(PALETTE.library.far)
    expect(lg).toBeGreaterThanOrEqual(lr)
    const [hr, , hb] = rgb(PALETTE.hotel.far)
    expect(hr).toBeGreaterThan(hb)
    const [, rg, rb] = rgb(PALETTE.rooftop.far)
    expect(rb).toBeGreaterThan(rg)
  })
})
