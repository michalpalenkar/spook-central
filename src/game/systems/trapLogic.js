import { TRAP } from '../constants.js'

export const TRAP_STATE = {
  READY: 'ready', // carried by the player
  THROWN: 'thrown',
  ARMED: 'armed', // open on the floor, waiting for a weakened ghost
  CAPTURING: 'capturing',
  CLOSED: 'closed',
}

export function createTrap() {
  return { state: TRAP_STATE.READY, timer: 0, cooldown: 0, targetId: null }
}

export function canThrow(trap) {
  return trap.state === TRAP_STATE.READY && trap.cooldown <= 0
}

/**
 * Launch velocity for a throw. With a target x (the tethered ghost) the
 * horizontal speed is chosen so the trap lands beneath it on flat ground;
 * without one it is lobbed a fixed distance in the facing direction.
 */
export function throwVelocity(fromX, targetX, facing, tuning = TRAP) {
  const vy = -tuning.THROW_SPEED_Y
  if (targetX === null || targetX === undefined) return { vx: facing * tuning.THROW_SPEED_X, vy }
  const flightTime = (2 * tuning.THROW_SPEED_Y) / tuning.GRAVITY
  const vx = (targetX - fromX) / flightTime
  return { vx: Math.max(-tuning.MAX_THROW_SPEED_X, Math.min(tuning.MAX_THROW_SPEED_X, vx)), vy }
}

export function throwTrap(trap) {
  if (!canThrow(trap)) return false
  trap.state = TRAP_STATE.THROWN
  trap.timer = 0
  trap.targetId = null
  return true
}

/**
 * The capturable ghost nearest the trap inside its capture cone: above the
 * trap, within CAPTURE_HEIGHT, and within a half-width that widens linearly
 * from half at the trap to full at the top. `candidates` are
 * { id, x, y, capturable }.
 */
export function findCaptureTarget(trapX, trapY, candidates, tuning = TRAP) {
  let best = null
  let bestDistance = Infinity
  for (const c of candidates) {
    if (!c.capturable) continue
    const height = trapY - c.y
    if (height < 0 || height > tuning.CAPTURE_HEIGHT) continue
    const halfWidth = tuning.CAPTURE_HALF_WIDTH * (0.5 + 0.5 * (height / tuning.CAPTURE_HEIGHT))
    if (Math.abs(c.x - trapX) > halfWidth) continue
    const distance = Math.hypot(c.x - trapX, height)
    if (distance < bestDistance) {
      best = c
      bestDistance = distance
    }
  }
  return best ? best.id : null
}

/**
 * Advances the trap by one frame. `world` is { x, y, grounded, candidates }.
 * Returns events: { armed, captureStarted, captured, returned }, where
 * captureStarted and captured hold the ghost id (or null).
 */
export function stepTrap(trap, world, dt, tuning = TRAP) {
  const events = { armed: false, captureStarted: null, captured: null, returned: false }
  trap.timer += dt

  switch (trap.state) {
    case TRAP_STATE.READY:
      trap.cooldown = Math.max(0, trap.cooldown - dt)
      trap.timer = 0
      break
    case TRAP_STATE.THROWN:
      if (world.grounded || trap.timer >= tuning.MAX_FLIGHT_TIME) {
        enter(trap, TRAP_STATE.ARMED)
        events.armed = true
      }
      break
    case TRAP_STATE.ARMED: {
      const targetId = findCaptureTarget(world.x, world.y, world.candidates, tuning)
      if (targetId !== null) {
        enter(trap, TRAP_STATE.CAPTURING)
        trap.targetId = targetId
        events.captureStarted = targetId
      } else if (trap.timer >= tuning.ARMED_TIME) {
        enter(trap, TRAP_STATE.CLOSED)
      }
      break
    }
    case TRAP_STATE.CAPTURING:
      if (trap.timer >= tuning.CAPTURE_TIME) {
        events.captured = trap.targetId
        enter(trap, TRAP_STATE.CLOSED)
      }
      break
    case TRAP_STATE.CLOSED:
      if (trap.timer >= tuning.CLOSED_TIME) {
        recallTrap(trap, tuning)
        events.returned = true
      }
      break
  }
  return events
}

/** 0..1 while capturing. */
export function captureProgress(trap, tuning = TRAP) {
  if (trap.state !== TRAP_STATE.CAPTURING) return 0
  return Math.min(1, trap.timer / tuning.CAPTURE_TIME)
}

/** Puts the trap back on the player's belt. */
export function recallTrap(trap, tuning = TRAP) {
  enter(trap, TRAP_STATE.READY)
  trap.cooldown = tuning.COOLDOWN
}

function enter(trap, state) {
  trap.state = state
  trap.timer = 0
  if (state !== TRAP_STATE.CAPTURING && state !== TRAP_STATE.CLOSED) trap.targetId = null
}
