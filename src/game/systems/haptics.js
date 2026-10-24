import { HAPTICS } from '../constants.js'

let enabled = true

export function setHapticsEnabled(value) {
  enabled = value
}

export function canVibrate(nav = globalThis.navigator) {
  return typeof nav?.vibrate === 'function'
}

/**
 * Vibrates the device where the browser supports it (not iOS Safari).
 * Returns whether a vibration was requested.
 */
export function vibrate(pattern = HAPTICS.HIT, nav = globalThis.navigator) {
  if (!enabled || !canVibrate(nav)) return false
  try {
    return nav.vibrate(pattern)
  } catch {
    return false
  }
}
