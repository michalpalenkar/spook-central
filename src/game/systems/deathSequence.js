import { PLAYER_COMBAT } from '../constants.js'

/** Timing of death → fade out → respawn. */
export function createDeathSequence() {
  return { active: false, timer: 0, fading: false }
}

export function startDeath(death, tuning = PLAYER_COMBAT) {
  if (death.active) return false
  death.active = true
  death.fading = false
  death.timer = tuning.DEATH_RESPAWN_DELAY
  return true
}

/**
 * Returns { fadeOut, respawn }: fadeOut fires once when DEATH_FADE_TIME is
 * left, respawn fires once when the timer runs out (and ends the sequence).
 */
export function stepDeath(death, dt, tuning = PLAYER_COMBAT) {
  const events = { fadeOut: false, respawn: false }
  if (!death.active) return events
  death.timer -= dt
  if (!death.fading && death.timer <= tuning.DEATH_FADE_TIME) {
    death.fading = true
    events.fadeOut = true
  }
  if (death.timer <= 0) {
    death.active = false
    events.respawn = true
  }
  return events
}
