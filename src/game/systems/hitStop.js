/** A short freeze of the simulation that sells the weight of a hit. */
export function createHitStop() {
  return { remaining: 0 }
}

/** Overlapping hit-stops don't stack; the longer one wins. */
export function triggerHitStop(hitStop, duration) {
  hitStop.remaining = Math.max(hitStop.remaining, duration)
}

/** Consumes real time. Returns whether the simulation is frozen this frame. */
export function stepHitStop(hitStop, dt) {
  if (hitStop.remaining <= 0) return false
  hitStop.remaining = Math.max(0, hitStop.remaining - dt)
  return true
}
