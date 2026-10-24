/**
 * A small seeded random number generator (mulberry32), so procedural art
 * comes out the same on every run. Returns a function giving floats in [0, 1).
 */
export function createRng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A float in [min, max). */
export function rangeOf(rng, min, max) {
  return min + rng() * (max - min)
}

/** An integer in [min, max]. */
export function intOf(rng, min, max) {
  return Math.floor(min + rng() * (max - min + 1))
}

/** One element of a non-empty array. */
export function pickOf(rng, items) {
  return items[Math.floor(rng() * items.length)]
}

/** A stable seed from a string (e.g. a texture key). */
export function seedFrom(text, base = 0) {
  let h = (base ^ 0x811c9dc5) >>> 0
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0
  return h
}
