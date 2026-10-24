import { GAME_HEIGHT } from '../constants.js'

// Parallax layers are drawn with Phaser scroll factors, so the camera's
// final scroll for the frame moves them with no lag. A repeating strip is a
// row (or grid) of copies; these helpers say where the copies go.
//
// An object at layer position P with scroll factor f is drawn on screen at
// P − scroll · f.

/** Where an object at layer position `position` lands on screen. */
export function screenPosition(position, scroll, factor) {
  return position - scroll * factor
}

/**
 * Layer position of the first copy of a strip repeating every `period`, so
 * the copies starting there cover the screen from its left (or top) edge.
 * `drift` slides the strip along over time (fog).
 */
export function firstCopyAt(scroll, factor, period, drift = 0) {
  return Math.floor((scroll * factor + drift) / period) * period - drift
}

/** How many copies of a strip of length `period` cover `span` px at any offset, with one to spare. */
export function copiesToCover(span, period) {
  return Math.ceil(span / period) + 2
}

/**
 * Layer y of a strip that doesn't repeat vertically:
 * - 'bottom': its bottom edge meets the bottom of the screen when the camera
 *   is at the bottom of the room (`maxScrollY`). As the camera climbs, a far
 *   layer sinks slowly and a foreground layer drops away quickly.
 * - 'top': its top edge meets the top of the screen with the camera at the top.
 */
export function anchoredY(layer, maxScrollY) {
  if (layer.anchor === 'top') return 0
  return GAME_HEIGHT - layer.height + maxScrollY * layer.factorY
}
