import { describe, expect, it } from 'vitest'
import { ESSENCE } from '../constants.js'
import { collectEssence, createWallet } from './essence.js'
import { createHealth, takeDamage } from './health.js'

const TUNING = { ...ESSENCE, HEAL_COST: 3 }

describe('ecto-essence', () => {
  it('counts as currency at full health without healing', () => {
    const wallet = createWallet()
    const health = createHealth(5)
    expect(collectEssence(wallet, health, 4, TUNING)).toBe(0)
    expect(wallet.essence).toBe(4)
    expect(wallet.healProgress).toBe(0)
  })

  it('heals one HP per HEAL_COST collected while hurt', () => {
    const wallet = createWallet()
    const health = createHealth(5)
    takeDamage(health, 2, 0)
    expect(collectEssence(wallet, health, 1, TUNING)).toBe(0)
    expect(collectEssence(wallet, health, 1, TUNING)).toBe(0)
    expect(collectEssence(wallet, health, 1, TUNING)).toBe(1)
    expect(health.hp).toBe(4)
    expect(wallet.essence).toBe(3)
  })

  it('a big pickup can heal several HP but never past max', () => {
    const wallet = createWallet()
    const health = createHealth(5)
    takeDamage(health, 2, 0)
    expect(collectEssence(wallet, health, 10, TUNING)).toBe(2)
    expect(health.hp).toBe(5)
    expect(wallet.essence).toBe(10)
    expect(wallet.healProgress).toBe(0)
  })
})
