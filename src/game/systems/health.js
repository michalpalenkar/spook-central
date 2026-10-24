import { PLAYER_COMBAT } from '../constants.js'

export function createHealth(max = PLAYER_COMBAT.MAX_HP) {
  return { hp: max, max, invulnerableTimer: 0 }
}

export function isDead(health) {
  return health.hp <= 0
}

export function isInvulnerable(health) {
  return health.invulnerableTimer > 0
}

/**
 * Applies damage unless the target is invulnerable or already dead. A hit
 * starts the invulnerability window. Returns whether the hit landed.
 */
export function takeDamage(health, amount, invulnerableTime = PLAYER_COMBAT.INVULNERABLE_TIME) {
  if (amount <= 0 || isDead(health) || isInvulnerable(health)) return false
  health.hp = Math.max(0, health.hp - amount)
  health.invulnerableTimer = invulnerableTime
  return true
}

/** Restores HP up to the maximum. Returns how much was actually healed. */
export function heal(health, amount) {
  if (isDead(health)) return 0
  const before = health.hp
  health.hp = Math.min(health.max, health.hp + amount)
  return health.hp - before
}

export function tickHealth(health, dt) {
  health.invulnerableTimer = Math.max(0, health.invulnerableTimer - dt)
}

export function restoreHealth(health) {
  health.hp = health.max
  health.invulnerableTimer = 0
}
