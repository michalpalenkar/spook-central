import { ESSENCE } from '../constants.js'
import { heal } from './health.js'

export function createWallet() {
  // healProgress counts essence toward the next HP restored.
  return { essence: 0, healProgress: 0 }
}

/**
 * Banks collected ecto-essence. Every HEAL_COST essence picked up while hurt
 * restores one HP; at full health it only counts as currency. Returns the HP
 * healed.
 */
export function collectEssence(wallet, health, amount = 1, tuning = ESSENCE) {
  wallet.essence += amount
  if (health.hp >= health.max) {
    wallet.healProgress = 0
    return 0
  }
  wallet.healProgress += amount
  let healed = 0
  while (wallet.healProgress >= tuning.HEAL_COST && health.hp < health.max) {
    wallet.healProgress -= tuning.HEAL_COST
    healed += heal(health, 1)
  }
  if (health.hp >= health.max) wallet.healProgress = 0
  return healed
}
