import { PLAYER } from '../constants.js'

export function approach(value, target, maxDelta) {
  if (value < target) return Math.min(value + maxDelta, target)
  return Math.max(value - maxDelta, target)
}

export function createMovementState() {
  return {
    vx: 0,
    vy: 0,
    grounded: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    isJumping: false,
  }
}

/**
 * Advances platformer movement by one frame and writes the new velocity to
 * `state.vx` / `state.vy`.
 *
 * - input: { move: -1 | 0 | 1, jumpPressed, jumpHeld }
 * - contact: { grounded, vx, vy } as reported by physics after its step, so
 *   collisions that zeroed the velocity are respected.
 *
 * Returns { jumped, landed, landingSpeed } for animation and effects.
 */
export function stepMovement(state, input, contact, dt, tuning = PLAYER) {
  const events = { jumped: false, landed: false, landingSpeed: 0 }

  if (contact.grounded && !state.grounded) {
    events.landed = true
    // state.vy still holds the velocity we commanded before physics zeroed it.
    events.landingSpeed = Math.max(0, state.vy)
  }
  state.grounded = contact.grounded

  let vx = contact.vx
  let vy = contact.vy

  if (state.grounded) {
    state.coyoteTimer = tuning.COYOTE_TIME
    if (vy >= 0) state.isJumping = false
  } else {
    state.coyoteTimer = Math.max(0, state.coyoteTimer - dt)
  }

  state.jumpBufferTimer = input.jumpPressed
    ? tuning.JUMP_BUFFER_TIME
    : Math.max(0, state.jumpBufferTimer - dt)

  // Horizontal: near-instant acceleration, and turning on the ground drops
  // the old momentum entirely so reversals feel crisp.
  if (state.grounded && input.move !== 0 && vx * input.move < 0) vx = 0
  const accel = state.grounded
    ? input.move !== 0 ? tuning.GROUND_ACCEL : tuning.GROUND_DECEL
    : input.move !== 0 ? tuning.AIR_ACCEL : tuning.AIR_DECEL
  vx = approach(vx, input.move * tuning.RUN_SPEED, accel * dt)

  if (state.jumpBufferTimer > 0 && state.coyoteTimer > 0) {
    vy = -tuning.JUMP_VELOCITY
    state.jumpBufferTimer = 0
    state.coyoteTimer = 0
    state.isJumping = true
    events.jumped = true
  } else if (state.isJumping && (vy >= 0 || !input.jumpHeld)) {
    // Variable jump height: releasing early cuts the remaining rise.
    if (vy < 0) vy *= tuning.JUMP_CUT_MULTIPLIER
    state.isJumping = false
  }

  const gravity = vy > 0 ? tuning.GRAVITY * tuning.FALL_GRAVITY_MULTIPLIER : tuning.GRAVITY
  vy = Math.min(vy + gravity * dt, tuning.MAX_FALL_SPEED)

  state.vx = vx
  state.vy = vy
  return events
}
