import { ABILITY, FLAG } from './abilities.js'

// The three set-piece captures, the flag each one sets in the session (and
// save), and the ability it leaves behind as a relic to pick up.
export const BOSSES = {
  librarian: { name: 'The Librarian', flag: FLAG.LIBRARIAN_DEFEATED, reward: ABILITY.PKE },
  slimer: { name: 'Slimer', flag: FLAG.SLIMER_CAPTURED, reward: ABILITY.DASH },
  mallow: { name: 'The Marshmallow Mascot', flag: FLAG.MALLOW_DEFEATED, reward: null },
}

export function isBeaten(session, bossId) {
  return session.flags.has(BOSSES[bossId].flag)
}

/** Marks a boss beaten. Returns whether that was news. */
export function markBeaten(session, bossId) {
  const { flag } = BOSSES[bossId]
  if (session.flags.has(flag)) return false
  session.flags.add(flag)
  return true
}

/**
 * The ability relic still waiting where `bossId` was beaten, or null: the
 * boss is beaten but the player hasn't picked its reward up yet (say, they
 * left the room or died first).
 */
export function pendingRelic(session, bossId) {
  const { reward } = BOSSES[bossId]
  if (!reward || !isBeaten(session, bossId) || session.abilities.has(reward)) return null
  return reward
}
