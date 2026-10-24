import { SHOP } from '../constants.js'
import { ABILITY, FLAG, grantAbility } from './abilities.js'

// The supply desk in the firehouse bunk room sells the Slime Boots and a
// spare battery cell (+1 max HP), one of each, for ecto-essence. Pressing up
// at the desk buys the first item not owned yet.

export const SHOP_ITEMS = [
  { id: 'slime-boots', name: 'Slime Boots', price: SHOP.BOOTS_PRICE, ability: ABILITY.BOOTS },
  { id: 'battery-cell', name: 'Spare battery cell', price: SHOP.BATTERY_CELL_PRICE, flag: FLAG.BATTERY_CELL_BOUGHT },
]

export function isOwned(session, item) {
  return item.ability ? session.abilities.has(item.ability) : session.flags.has(item.flag)
}

/** The item the desk is offering, or null when sold out. */
export function nextItem(session, items = SHOP_ITEMS) {
  return items.find((item) => !isOwned(session, item)) ?? null
}

/**
 * Buys `item`. Returns { ok, reason } with reason 'owned' or 'too-poor'.
 *
 * The price also comes off the essence the player would respawn with, so
 * dying can't refund a purchase.
 */
export function buy(session, item) {
  if (isOwned(session, item)) return { ok: false, reason: 'owned' }
  if (session.wallet.essence < item.price) return { ok: false, reason: 'too-poor' }
  session.wallet.essence -= item.price
  session.respawn.essence = Math.max(0, session.respawn.essence - item.price)
  if (item.ability) {
    grantAbility(session, item.ability)
  } else {
    session.flags.add(item.flag)
    session.maxHp += 1
    session.hp += 1
  }
  return { ok: true, reason: null }
}
