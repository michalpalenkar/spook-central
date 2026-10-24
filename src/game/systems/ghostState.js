import { GHOST } from '../constants.js'

export const GHOST_STATUS = {
  FREE: 'free',
  CAPTURING: 'capturing',
  CAPTURED: 'captured',
}

export function createGhostState(tuning = GHOST) {
  return { hp: tuning.MAX_HP, sinceHit: Infinity, status: GHOST_STATUS.FREE }
}

export function weakenThreshold(tuning = GHOST) {
  return tuning.MAX_HP * tuning.WEAKEN_FRACTION
}

export function isWeakened(ghost, tuning = GHOST) {
  return ghost.hp <= weakenThreshold(tuning)
}

/**
 * Proton stream damage. The stream can't destroy a ghost, only exhaust it,
 * so HP floors at 0. Returns whether this hit made the ghost weakened.
 */
export function damageGhost(ghost, amount, tuning = GHOST) {
  if (ghost.status !== GHOST_STATUS.FREE || amount <= 0) return false
  const wasWeakened = isWeakened(ghost, tuning)
  ghost.hp = Math.max(0, ghost.hp - amount)
  ghost.sinceHit = 0
  return !wasWeakened && isWeakened(ghost, tuning)
}

/** Ghosts left alone for a while regain strength and can slip free again. */
export function tickGhostState(ghost, dt, tuning = GHOST) {
  if (ghost.status !== GHOST_STATUS.FREE) return
  ghost.sinceHit += dt
  if (ghost.sinceHit >= tuning.RECOVER_DELAY) {
    ghost.hp = Math.min(tuning.MAX_HP, ghost.hp + tuning.RECOVER_RATE * dt)
  }
}

export function canBeCaptured(ghost, tuning = GHOST) {
  return ghost.status === GHOST_STATUS.FREE && isWeakened(ghost, tuning)
}

/** Only an unweakened, free ghost hurts on contact; a dazed one doesn't. */
export function dealsContactDamage(ghost, tuning = GHOST) {
  return ghost.status === GHOST_STATUS.FREE && !isWeakened(ghost, tuning)
}

export function resetGhostState(ghost, tuning = GHOST) {
  Object.assign(ghost, createGhostState(tuning))
}
