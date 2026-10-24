import { describe, expect, it } from 'vitest'
import { PLAYER_COMBAT } from '../constants.js'
import { createHealth, heal, isDead, isInvulnerable, restoreHealth, takeDamage, tickHealth } from './health.js'

describe('health', () => {
  it('starts full and not invulnerable', () => {
    const health = createHealth()
    expect(health.hp).toBe(PLAYER_COMBAT.MAX_HP)
    expect(isInvulnerable(health)).toBe(false)
  })

  it('a hit removes HP and starts invulnerability', () => {
    const health = createHealth(5)
    expect(takeDamage(health, 1, 1)).toBe(true)
    expect(health.hp).toBe(4)
    expect(isInvulnerable(health)).toBe(true)
  })

  it('ignores hits while invulnerable, then accepts them once it wears off', () => {
    const health = createHealth(5)
    takeDamage(health, 1, 1)
    expect(takeDamage(health, 1, 1)).toBe(false)
    expect(health.hp).toBe(4)
    tickHealth(health, 0.5)
    expect(takeDamage(health, 1, 1)).toBe(false)
    tickHealth(health, 0.5)
    expect(isInvulnerable(health)).toBe(false)
    expect(takeDamage(health, 1, 1)).toBe(true)
    expect(health.hp).toBe(3)
  })

  it('dies at zero and never goes negative', () => {
    const health = createHealth(2)
    takeDamage(health, 5, 0)
    expect(health.hp).toBe(0)
    expect(isDead(health)).toBe(true)
    expect(takeDamage(health, 1, 0)).toBe(false)
  })

  it('heals up to the maximum, but not the dead', () => {
    const health = createHealth(5)
    takeDamage(health, 3, 0)
    expect(heal(health, 10)).toBe(3)
    expect(health.hp).toBe(5)
    takeDamage(health, 5, 0)
    expect(heal(health, 1)).toBe(0)
  })

  it('restore refills HP and clears invulnerability', () => {
    const health = createHealth(5)
    takeDamage(health, 5, 1)
    restoreHealth(health)
    expect(health.hp).toBe(5)
    expect(isInvulnerable(health)).toBe(false)
  })
})
