import { MALLOW } from '../constants.js'
import { GHOST_STATUS, canBeCaptured, createGhostState, isWeakened, resetGhostState, tickGhostState } from './ghostState.js'

// The marshmallow mascot's behaviour. He walks along the summit floor
// toward the player and alternates two attacks: a stomp (crouch, leap toward
// the player, and shockwaves along the floor where he lands) and a volley of
// marshmallow globs lobbed at the player. The proton stream wears him down
// until he kneels; a trap thrown under him then tears out a chunk of spirit.
// After PHASES traps he is beaten. Each round he comes back faster and
// throws more.
//
// Positions are his feet (x, feetY) in px; he never leaves the floor except
// while stomping. HP uses the ghost rules (systems/ghostState.js) with
// MALLOW tuning.

export const MALLOW_STATE = {
  DORMANT: 'dormant',
  WAKING: 'waking',
  WALK: 'walk',
  WINDUP: 'windup',
  AIRBORNE: 'airborne',
  LANDED: 'landed',
  THROW: 'throw',
  KNEEL: 'kneel',
  CAPTURING: 'capturing',
  ROAR: 'roar',
  DEFEATED: 'defeated',
}

const FIGHTING = new Set([
  MALLOW_STATE.WALK,
  MALLOW_STATE.WINDUP,
  MALLOW_STATE.LANDED,
  MALLOW_STATE.THROW,
])

const HARMFUL = new Set([...FIGHTING, MALLOW_STATE.AIRBORNE, MALLOW_STATE.ROAR])

export function createMallowBrain(x, floorY, tuning = MALLOW) {
  return {
    state: MALLOW_STATE.DORMANT,
    timer: 0,
    x,
    feetY: floorY,
    vx: 0,
    vy: 0,
    facing: -1,
    phase: 1,
    attacks: 0,
    throwsLeft: 0,
    health: createGhostState(tuning),
  }
}

export function mallowDealsContactDamage(brain) {
  return HARMFUL.has(brain.state)
}

export function mallowCapturable(brain, tuning = MALLOW) {
  return brain.state === MALLOW_STATE.KNEEL && canBeCaptured(brain.health, tuning)
}

/** Where the stream and the trap aim: his head, lower when he kneels. */
export function mallowCore(brain, tuning = MALLOW) {
  const kneeling = brain.state === MALLOW_STATE.KNEEL || brain.state === MALLOW_STATE.CAPTURING
  return { x: brain.x, y: brain.feetY - (kneeling ? tuning.KNEEL_CORE_HEIGHT : tuning.CORE_HEIGHT) }
}

/** Speed multiplier for the current phase. */
export function phaseSpeed(brain, tuning = MALLOW) {
  return 1 + (brain.phase - 1) * tuning.PHASE_SPEED_STEP
}

function enter(brain, state) {
  brain.state = state
  brain.timer = 0
}

/**
 * Launch velocity for a glob from (x, y) to land at (targetX, targetY)
 * after `time` seconds under `gravity`.
 */
export function lobVelocity(x, y, targetX, targetY, time, gravity) {
  return { vx: (targetX - x) / time, vy: (targetY - y - 0.5 * gravity * time * time) / time }
}

/**
 * Advances the mascot by one frame.
 *
 * ctx: { playerX, triggered, floorY, minX, maxX, globGravity, throwFrom }
 * `throwFrom` is the height above his feet that globs leave from.
 *
 * Returns events: { woke, landed, globs: [{ x, y, vx, vy }], kneeled, recovered }.
 */
export function stepMallow(brain, ctx, dt, tuning = MALLOW) {
  const events = { woke: false, landed: false, globs: [], kneeled: false, recovered: false }
  brain.timer += dt
  const speed = phaseSpeed(brain, tuning)
  const towardPlayer = Math.sign(ctx.playerX - brain.x) || brain.facing

  if (FIGHTING.has(brain.state)) {
    tickGhostState(brain.health, dt, tuning)
    if (isWeakened(brain.health, tuning)) {
      enter(brain, MALLOW_STATE.KNEEL)
      brain.vx = 0
      events.kneeled = true
    }
  }

  switch (brain.state) {
    case MALLOW_STATE.DORMANT:
      if (ctx.triggered) {
        enter(brain, MALLOW_STATE.WAKING)
        events.woke = true
      }
      break
    case MALLOW_STATE.WAKING:
      if (brain.timer >= tuning.WAKE_TIME) enter(brain, MALLOW_STATE.WALK)
      break
    case MALLOW_STATE.WALK:
      brain.facing = towardPlayer
      brain.vx = towardPlayer * tuning.WALK_SPEED * speed
      if (brain.timer >= tuning.WALK_TIME / speed) {
        brain.vx = 0
        brain.attacks++
        if (brain.attacks % 2 === 1) {
          enter(brain, MALLOW_STATE.WINDUP)
        } else {
          enter(brain, MALLOW_STATE.THROW)
          brain.throwsLeft = tuning.THROW_COUNT + (brain.phase - 1)
        }
      }
      break
    case MALLOW_STATE.WINDUP:
      brain.vx = 0
      if (brain.timer >= tuning.STOMP_WINDUP / speed) {
        const airTime = (2 * tuning.STOMP_JUMP_VELOCITY) / tuning.STOMP_GRAVITY
        const vx = (ctx.playerX - brain.x) / airTime
        brain.vx = Math.max(-tuning.STOMP_MAX_SPEED_X, Math.min(tuning.STOMP_MAX_SPEED_X, vx))
        brain.vy = -tuning.STOMP_JUMP_VELOCITY
        enter(brain, MALLOW_STATE.AIRBORNE)
      }
      break
    case MALLOW_STATE.AIRBORNE:
      brain.vy += tuning.STOMP_GRAVITY * dt
      brain.feetY += brain.vy * dt
      if (brain.vy > 0 && brain.feetY >= ctx.floorY) {
        brain.feetY = ctx.floorY
        brain.vx = 0
        brain.vy = 0
        events.landed = true
        enter(brain, MALLOW_STATE.LANDED)
      }
      break
    case MALLOW_STATE.LANDED:
      if (brain.timer >= tuning.STOMP_RECOVER_TIME / speed) enter(brain, MALLOW_STATE.WALK)
      break
    case MALLOW_STATE.THROW:
      brain.facing = towardPlayer
      if (brain.timer >= tuning.THROW_INTERVAL / speed) {
        brain.timer = 0
        // Spread the volley around the player: on them, then either side.
        const index = tuning.THROW_COUNT + (brain.phase - 1) - brain.throwsLeft
        const spread = index === 0 ? 0 : (index % 2 === 1 ? -1 : 1) * Math.ceil(index / 2) * 24
        const y = brain.feetY - ctx.throwFrom
        const v = lobVelocity(brain.x, y, ctx.playerX + spread, ctx.floorY, tuning.THROW_FLIGHT_TIME, ctx.globGravity)
        events.globs.push({ x: brain.x, y, vx: v.vx, vy: v.vy })
        brain.throwsLeft--
        if (brain.throwsLeft <= 0) enter(brain, MALLOW_STATE.WALK)
      }
      break
    case MALLOW_STATE.KNEEL:
      brain.vx = 0
      tickGhostState(brain.health, dt, tuning)
      if (!isWeakened(brain.health, tuning)) {
        enter(brain, MALLOW_STATE.WALK)
        events.recovered = true
      }
      break
    case MALLOW_STATE.ROAR:
      brain.vx = 0
      if (brain.timer >= tuning.ROAR_TIME) enter(brain, MALLOW_STATE.WALK)
      break
    default:
      brain.vx = 0
  }

  brain.x = Math.max(ctx.minX, Math.min(ctx.maxX, brain.x + brain.vx * dt))
  return events
}

export function startMallowCapture(brain) {
  enter(brain, MALLOW_STATE.CAPTURING)
  brain.health.status = GHOST_STATUS.CAPTURING
}

/**
 * The trap took a chunk of him. Returns true when that was the last one and
 * he is beaten; otherwise he roars back to full strength, one phase further.
 */
export function mallowCaptured(brain, tuning = MALLOW) {
  if (brain.phase >= tuning.PHASES) {
    enter(brain, MALLOW_STATE.DEFEATED)
    brain.health.status = GHOST_STATUS.CAPTURED
    return true
  }
  brain.phase++
  resetGhostState(brain.health, tuning)
  enter(brain, MALLOW_STATE.ROAR)
  return false
}
