import { LIBRARIAN } from '../constants.js'
import { GHOST_STATUS, canBeCaptured, createGhostState, isWeakened, tickGhostState } from './ghostState.js'

// The Librarian's behaviour. She sleeps until the player walks into the
// vault, then drifts between anchor points and alternates two attacks: a
// volley of books thrown at the player, and a shrieking swoop (a short
// wind-up, then a straight dash at where the player was). Worn down with the
// proton stream she is stunned: she sinks, stops attacking and can be
// trapped. Left alone she recovers, angrier and faster.
//
// HP, weakening and recovery use the ghost rules (systems/ghostState.js)
// with LIBRARIAN tuning.

export const LIBRARIAN_STATE = {
  DORMANT: 'dormant',
  WAKING: 'waking',
  DRIFT: 'drift',
  VOLLEY: 'volley',
  WINDUP: 'windup',
  SWOOP: 'swoop',
  STUNNED: 'stunned',
  CAPTURING: 'capturing',
  DEFEATED: 'defeated',
}

const ATTACKING = new Set([
  LIBRARIAN_STATE.DRIFT,
  LIBRARIAN_STATE.VOLLEY,
  LIBRARIAN_STATE.WINDUP,
  LIBRARIAN_STATE.SWOOP,
])

/** `anchors` are the points (px) she drifts between. */
export function createLibrarianBrain(x, y, anchors, tuning = LIBRARIAN) {
  return {
    state: LIBRARIAN_STATE.DORMANT,
    timer: 0,
    x,
    y,
    vx: 0,
    vy: 0,
    anchors,
    anchorIndex: 0,
    attacks: 0,
    booksLeft: 0,
    swoop: { x: 0, y: 0 },
    angry: false,
    health: createGhostState(tuning),
  }
}

export function isAwake(brain) {
  return brain.state !== LIBRARIAN_STATE.DORMANT && brain.state !== LIBRARIAN_STATE.DEFEATED
}

export function librarianDealsContactDamage(brain) {
  return ATTACKING.has(brain.state)
}

export function librarianCapturable(brain, tuning = LIBRARIAN) {
  return brain.state === LIBRARIAN_STATE.STUNNED && canBeCaptured(brain.health, tuning)
}

function enter(brain, state) {
  brain.state = state
  brain.timer = 0
}

function steer(brain, desiredX, desiredY, dt, tuning) {
  const blend = Math.min(1, tuning.STEER_RATE * dt)
  brain.vx += (desiredX - brain.vx) * blend
  brain.vy += (desiredY - brain.vy) * blend
}

function toward(brain, x, y, speed) {
  const dx = x - brain.x
  const dy = y - brain.y
  const d = Math.hypot(dx, dy)
  if (d < 1) return { x: 0, y: 0 }
  return { x: (dx / d) * speed, y: (dy / d) * speed }
}

/**
 * Advances the Librarian by one frame and moves her (brain.x / brain.y).
 *
 * ctx: { playerX, playerY, triggered, tethered, floorY } — `triggered` once
 * the player has walked into the vault, `floorY` the floor beneath her (px).
 *
 * Returns events: { woke, book: { x, y, vx, vy } | null, stunned, recovered }.
 */
export function stepLibrarian(brain, ctx, dt, tuning = LIBRARIAN) {
  const events = { woke: false, book: null, stunned: false, recovered: false }
  brain.timer += dt
  const pace = brain.angry ? tuning.ANGRY_MULTIPLIER : 1
  const speedScale = pace * (ctx.tethered ? tuning.TETHERED_SPEED_MULTIPLIER : 1)

  if (ATTACKING.has(brain.state)) {
    tickGhostState(brain.health, dt, tuning)
    if (isWeakened(brain.health, tuning)) {
      enter(brain, LIBRARIAN_STATE.STUNNED)
      events.stunned = true
    }
  }

  switch (brain.state) {
    case LIBRARIAN_STATE.DORMANT:
      steer(brain, 0, 0, dt, tuning)
      if (ctx.triggered) {
        enter(brain, LIBRARIAN_STATE.WAKING)
        events.woke = true
      }
      break
    case LIBRARIAN_STATE.WAKING:
      steer(brain, 0, 0, dt, tuning)
      if (brain.timer >= tuning.WAKE_TIME) enter(brain, LIBRARIAN_STATE.DRIFT)
      break
    case LIBRARIAN_STATE.DRIFT: {
      const anchor = brain.anchors[brain.anchorIndex % brain.anchors.length]
      const desired = toward(brain, anchor.x, anchor.y, tuning.DRIFT_SPEED * speedScale)
      steer(brain, desired.x, desired.y, dt, tuning)
      if (brain.timer >= tuning.DRIFT_TIME / pace) {
        brain.anchorIndex++
        brain.attacks++
        if (brain.attacks % 2 === 1) {
          enter(brain, LIBRARIAN_STATE.VOLLEY)
          brain.booksLeft = tuning.VOLLEY_BOOKS
        } else {
          enter(brain, LIBRARIAN_STATE.WINDUP)
        }
      }
      break
    }
    case LIBRARIAN_STATE.VOLLEY:
      steer(brain, 0, 0, dt, tuning)
      if (brain.timer >= tuning.VOLLEY_INTERVAL / pace) {
        brain.timer = 0
        const v = toward(brain, ctx.playerX, ctx.playerY, tuning.BOOK_SPEED)
        events.book = { x: brain.x, y: brain.y, vx: v.x, vy: v.y }
        brain.booksLeft--
        if (brain.booksLeft <= 0) enter(brain, LIBRARIAN_STATE.DRIFT)
      }
      break
    case LIBRARIAN_STATE.WINDUP:
      steer(brain, 0, 0, dt, tuning)
      if (brain.timer >= tuning.SWOOP_WINDUP / pace) {
        const v = toward(brain, ctx.playerX, ctx.playerY, 1)
        brain.swoop = v.x === 0 && v.y === 0 ? { x: 1, y: 0 } : v
        enter(brain, LIBRARIAN_STATE.SWOOP)
      }
      break
    case LIBRARIAN_STATE.SWOOP: {
      const speed = tuning.SWOOP_SPEED * speedScale
      brain.vx = brain.swoop.x * speed
      brain.vy = brain.swoop.y * speed
      if (brain.timer >= tuning.SWOOP_TIME) enter(brain, LIBRARIAN_STATE.DRIFT)
      break
    }
    case LIBRARIAN_STATE.STUNNED:
      tickGhostState(brain.health, dt, tuning)
      steer(brain, 0, tuning.STUN_SINK_SPEED, dt, tuning)
      if (!isWeakened(brain.health, tuning)) {
        brain.angry = true
        enter(brain, LIBRARIAN_STATE.DRIFT)
        events.recovered = true
      }
      break
    default:
      brain.vx = 0
      brain.vy = 0
  }

  if (brain.state !== LIBRARIAN_STATE.CAPTURING && brain.state !== LIBRARIAN_STATE.DEFEATED) {
    brain.x += brain.vx * dt
    brain.y += brain.vy * dt
    if (ctx.floorY !== null && ctx.floorY !== undefined) {
      brain.y = Math.min(brain.y, ctx.floorY - tuning.MIN_HOVER_HEIGHT)
    }
  }
  return events
}

/** The trap has her: she stops fighting while she's pulled in. */
export function startLibrarianCapture(brain) {
  brain.state = LIBRARIAN_STATE.CAPTURING
  brain.health.status = GHOST_STATUS.CAPTURING
  brain.timer = 0
}

export function defeatLibrarian(brain) {
  brain.state = LIBRARIAN_STATE.DEFEATED
  brain.health.status = GHOST_STATUS.CAPTURED
}
