import { PLATFORM_LANDING_TOLERANCE } from '../constants.js'

/**
 * A one-way platform catches a body only while it is falling (or resting)
 * and its feet started the step at or above the platform's top.
 */
export function canLandOnPlatform(previousBottom, platformTop, vy) {
  return vy >= 0 && previousBottom <= platformTop + PLATFORM_LANDING_TOLERANCE
}
