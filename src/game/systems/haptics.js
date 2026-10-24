import { HAPTICS } from '../constants.js'

let enabled = true

export function setHapticsEnabled(value) {
  enabled = value
}

export function canVibrate(nav = globalThis.navigator) {
  return typeof nav?.vibrate === 'function'
}

// Browsers ignore (and Chrome logs) vibrations before the user has touched
// or clicked the page. Where userActivation isn't supported, just try.
function hasUserActivation(nav) {
  return nav?.userActivation?.hasBeenActive !== false
}

/**
 * Vibrates the device where the browser supports it (not iOS Safari) and
 * the user has interacted with the page. Returns whether a vibration was
 * requested.
 */
export function vibrate(pattern = HAPTICS.HIT, nav = globalThis.navigator) {
  if (!enabled || !canVibrate(nav) || !hasUserActivation(nav)) return false
  try {
    return nav.vibrate(pattern)
  } catch {
    return false
  }
}
