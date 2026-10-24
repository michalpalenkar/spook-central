import { TOUCH } from '../constants.js'

const DEG_PER_RAD = 180 / Math.PI

// Screen-space angle of each direction (y grows downward).
const DIRECTION_ANGLES = { right: 0, down: 90, left: 180, up: -90 }

function angularDistance(a, b) {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

/**
 * Directions held by a finger at (dx, dy) from the D-pad centre. The pad is
 * split into 8 equal sectors: cardinals, plus diagonals that hold both
 * neighbours. Inside the central deadzone nothing is held.
 */
export function dpadDirections(dx, dy, radius, tuning = TOUCH) {
  const held = { left: false, right: false, up: false, down: false }
  if (Math.hypot(dx, dy) < radius * tuning.DPAD_DEADZONE) return held

  const angle = Math.atan2(dy, dx) * DEG_PER_RAD
  const reach = 45 + tuning.DPAD_DIAGONAL_HALF_ANGLE
  for (const [direction, axis] of Object.entries(DIRECTION_ANGLES)) {
    held[direction] = angularDistance(angle, axis) < reach
  }
  return held
}

/**
 * Actions held by one finger.
 *
 * - hit: what is under the finger: 'dpad', an action name, or null.
 * - point / dpad: finger position and D-pad { cx, cy, radius }, in the same
 *   coordinate space.
 * - anchoredToDpad: the finger went down on the D-pad. It keeps steering
 *   while it drifts off the pad, until it slides onto an action button.
 */
export function pointerActions({ hit, point, dpad, anchoredToDpad }) {
  if (hit && hit !== 'dpad') return [hit]
  if (hit !== 'dpad' && !anchoredToDpad) return []
  const directions = dpadDirections(point.x - dpad.cx, point.y - dpad.cy, dpad.radius)
  return Object.keys(directions).filter((direction) => directions[direction])
}
