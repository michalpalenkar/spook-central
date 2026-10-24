import { DEPTH, SCENERY } from '../constants.js'
import { PALETTE } from './palette.js'

// What each area draws behind and in front of the play layer. Every style
// names a painter in art/sceneryShapes.js. Indoor rooms show the area's
// architecture; outdoor rooms the sky, the skyline and the street or roof.
//
// Layers, back to front: backdrop (gradient or sky) → far → mid → the room →
// foreground. With the play layer that makes five.
const INDOOR_STYLES = {
  firehouse: { far: 'arches', mid: 'lockers', foreBottom: 'garage', foreTop: 'hooks' },
  library: { far: 'gothic', mid: 'shelves', foreBottom: 'bookPiles', foreTop: 'cobwebs' },
  hotel: { far: 'wallpaper', mid: 'chandeliers', foreBottom: 'lounge', foreTop: 'valance' },
  rooftop: { far: 'gothic', mid: 'lockers', foreBottom: 'parapet', foreTop: null },
}

const OUTDOOR_STYLES = {
  library: { far: 'skyline', mid: 'street', foreBottom: 'park', foreTop: 'branches' },
  rooftop: { far: 'skyline', mid: 'temple', foreBottom: 'parapet', foreTop: null },
}

// Outdoor areas with a thunderstorm (rain and lightning) instead of dust.
const STORMY_AREAS = new Set(['rooftop'])

export const DEFAULT_SCENERY_AREA = 'firehouse'

export const LAYER_KIND = {
  FAR: 'far',
  MID: 'mid',
  FORE_BOTTOM: 'foreBottom',
  FORE_TOP: 'foreTop',
}

/** The scenery variant a room uses: { area, outdoor, storm, key }. */
export function sceneryVariant(room) {
  const area = INDOOR_STYLES[room.area] ? room.area : DEFAULT_SCENERY_AREA
  const outdoor = Boolean(room.outdoor && OUTDOOR_STYLES[area])
  return { area, outdoor, storm: outdoor && STORMY_AREAS.has(area), key: `${area}-${outdoor ? 'out' : 'in'}` }
}

/** Every distinct variant used by a list of rooms (to generate textures for). */
export function sceneryVariants(rooms) {
  const byKey = new Map()
  for (const room of rooms) {
    const variant = sceneryVariant(room)
    byKey.set(variant.key, variant)
  }
  return [...byKey.values()]
}

/** Colours for a variant: the area's palette, plus its sky outdoors. */
export function sceneryPalette(variant) {
  const area = PALETTE[variant.area] ?? PALETTE[DEFAULT_SCENERY_AREA]
  return { ...area, sky: variant.outdoor ? PALETTE.sky[variant.area] : null }
}

export function backdropKey(variant) {
  return `backdrop-${variant.key}`
}

/**
 * The parallax layers of a variant, back to front: { kind, style, key,
 * factorX, factorY, width, height, anchor, depth }. See
 * systems/parallaxMath.js for the anchors.
 */
export function sceneryLayers(variant) {
  const styles = (variant.outdoor ? OUTDOOR_STYLES : INDOOR_STYLES)[variant.area]
  const far = variant.outdoor ? SCENERY.SKYLINE : SCENERY.FAR
  const mid = variant.outdoor ? SCENERY.STREET : SCENERY.MID
  const anchor = variant.outdoor ? 'bottom' : 'repeat'
  const layers = [
    { kind: LAYER_KIND.FAR, tuning: far, anchor, depth: DEPTH.SCENERY_FAR },
    { kind: LAYER_KIND.MID, tuning: mid, anchor, depth: DEPTH.SCENERY_MID },
    { kind: LAYER_KIND.FORE_TOP, tuning: SCENERY.FORE_TOP, anchor: 'top', depth: DEPTH.FOREGROUND },
    { kind: LAYER_KIND.FORE_BOTTOM, tuning: SCENERY.FORE_BOTTOM, anchor: 'bottom', depth: DEPTH.FOREGROUND },
  ]
  return layers
    .filter((layer) => styles[layer.kind])
    .map(({ kind, tuning, anchor: layerAnchor, depth }) => ({
      kind,
      style: styles[kind],
      key: `scenery-${variant.key}-${kind}`,
      factorX: tuning.FACTOR_X,
      factorY: tuning.FACTOR_Y,
      width: tuning.WIDTH,
      height: tuning.HEIGHT,
      anchor: layerAnchor,
      depth,
    }))
}
