/** How many dust motes float in a room `width` × `height` px (tuning: ATMOSPHERE). */
export function dustCount(width, height, { DUST_DENSITY, DUST_MIN, DUST_MAX }) {
  const count = Math.round(((width * height) / 1000) * DUST_DENSITY)
  return Math.min(DUST_MAX, Math.max(DUST_MIN, count))
}
