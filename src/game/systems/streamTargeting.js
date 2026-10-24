import { PROTON_STREAM } from '../constants.js'
import { castRay, hasLineOfSight } from './lineOfSight.js'

const DEG_TO_RAD = Math.PI / 180

/**
 * Picks the ghost the proton stream locks onto. `candidates` are
 * { id, x, y } for ghosts that can be hit. A ghost that is already tethered
 * stays tethered while it is within TETHER_RANGE and visible, wherever the
 * player faces; otherwise the nearest visible ghost in range and inside the
 * aim cone is acquired. Returns the target's id or null.
 */
export function selectStreamTarget(origin, facing, candidates, tiles, currentId = null, tuning = PROTON_STREAM) {
  const visible = (c) => hasLineOfSight(tiles, origin.x, origin.y, c.x, c.y, tuning.SAMPLE_STEP)

  if (currentId !== null) {
    const current = candidates.find((c) => c.id === currentId)
    if (current && Math.hypot(current.x - origin.x, current.y - origin.y) <= tuning.TETHER_RANGE && visible(current)) {
      return currentId
    }
  }

  const cosLimit = Math.cos(tuning.AIM_HALF_ANGLE * DEG_TO_RAD)
  let best = null
  let bestDistance = Infinity
  for (const c of candidates) {
    const dx = c.x - origin.x
    const dy = c.y - origin.y
    const distance = Math.hypot(dx, dy)
    if (distance > tuning.RANGE || distance >= bestDistance) continue
    // A ghost right on top of the nozzle counts as in front.
    if (distance > 0 && (dx * facing) / distance < cosLimit) continue
    if (!visible(c)) continue
    best = c
    bestDistance = distance
  }
  return best ? best.id : null
}

/** Where an untethered stream ends: full range ahead, or the first wall. */
export function streamEndpoint(origin, facing, tiles, tuning = PROTON_STREAM) {
  const hit = castRay(tiles, origin.x, origin.y, origin.x + facing * tuning.RANGE, origin.y, tuning.SAMPLE_STEP)
  return { x: hit.x, y: hit.y }
}
