import { describe, expect, it } from 'vitest'
import { SHOP } from '../constants.js'
import { ABILITY, FLAG } from './abilities.js'
import { BOSSES, isBeaten, markBeaten, pendingRelic } from './bosses.js'
import { newSession } from './session.js'
import { SHOP_ITEMS, buy, isOwned, nextItem } from './shop.js'

const WORLD = { startRoom: 'garage', defaultMaxHp: 5 }

describe('shop', () => {
  it('offers the Slime Boots first, then the battery cell, then nothing', () => {
    const s = newSession(WORLD)
    expect(nextItem(s).ability).toBe(ABILITY.BOOTS)
    s.abilities.add(ABILITY.BOOTS)
    expect(nextItem(s).flag).toBe(FLAG.BATTERY_CELL_BOUGHT)
    s.flags.add(FLAG.BATTERY_CELL_BOUGHT)
    expect(nextItem(s)).toBeNull()
  })

  it('refuses a sale the player can’t afford', () => {
    const s = newSession(WORLD)
    s.wallet.essence = SHOP.BOOTS_PRICE - 1
    expect(buy(s, SHOP_ITEMS[0])).toEqual({ ok: false, reason: 'too-poor' })
    expect(s.abilities.size).toBe(0)
  })

  it('sells the boots, taking the price off the respawn essence too', () => {
    const s = newSession(WORLD)
    s.wallet.essence = 30
    s.respawn.essence = 20
    expect(buy(s, SHOP_ITEMS[0])).toEqual({ ok: true, reason: null })
    expect(s.abilities.has(ABILITY.BOOTS)).toBe(true)
    expect(s.wallet.essence).toBe(30 - SHOP.BOOTS_PRICE)
    expect(s.respawn.essence).toBe(20 - SHOP.BOOTS_PRICE)
    expect(buy(s, SHOP_ITEMS[0])).toEqual({ ok: false, reason: 'owned' })
  })

  it('sells one battery cell for +1 max HP', () => {
    const s = newSession(WORLD)
    s.wallet.essence = SHOP.BATTERY_CELL_PRICE
    buy(s, SHOP_ITEMS[1])
    expect(s).toMatchObject({ maxHp: 6, hp: 6 })
    expect(isOwned(s, SHOP_ITEMS[1])).toBe(true)
    expect(s.respawn.essence).toBe(0)
  })
})

describe('bosses', () => {
  it('records a boss beaten once', () => {
    const s = newSession(WORLD)
    expect(isBeaten(s, 'librarian')).toBe(false)
    expect(markBeaten(s, 'librarian')).toBe(true)
    expect(markBeaten(s, 'librarian')).toBe(false)
    expect(s.flags.has(BOSSES.librarian.flag)).toBe(true)
  })

  it('leaves a relic until its ability is picked up', () => {
    const s = newSession(WORLD)
    expect(pendingRelic(s, 'slimer')).toBeNull()
    markBeaten(s, 'slimer')
    expect(pendingRelic(s, 'slimer')).toBe(ABILITY.DASH)
    s.abilities.add(ABILITY.DASH)
    expect(pendingRelic(s, 'slimer')).toBeNull()
    markBeaten(s, 'mallow')
    expect(pendingRelic(s, 'mallow')).toBeNull()
  })
})
