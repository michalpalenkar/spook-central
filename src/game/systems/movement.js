import { PLAYER, PLAYER_MOVES } from '../constants.js'

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
    // Ecto-Dash: time left in the current dash, its direction, the cooldown,
    // and whether the one air dash per jump is still unused.
    dashTimer: 0,
    dashElapsed: 0,
    dashDir: 0,
    dashCooldown: 0,
    airDashReady: true,
    // Slime Boots: the side of the wall being clung to (-1, 0, 1), time left
    // to wall-jump after letting go, and the input lock after a wall jump.
    wallSide: 0,
    wallCoyoteTimer: 0,
    lastWallSide: 0,
    wallJumpLock: 0,
  }
}

export function isDashing(state) {
  return state.dashTimer > 0
}

const NO_ABILITIES = { dash: false, cling: false }

/**
 * Advances platformer movement by one frame and writes the new velocity to
 * `state.vx` / `state.vy`.
 *
 * - input: { move: -1 | 0 | 1, jumpPressed, jumpHeld, dashPressed, facing,
 *   abilities: { dash, cling } }
 * - contact: { grounded, vx, vy, wall, insideBarrier } as reported by
 *   physics after its step, so collisions that zeroed the velocity are
 *   respected. `wall` is the side (-1, 0, 1) touching a slimed wall;
 *   `insideBarrier` keeps a dash going until the body is out of ectoplasm.
 *
 * Returns { jumped, landed, landingSpeed, dashed, wallJumped, clinging } for
 * animation and effects.
 */
export function stepMovement(state, input, contact, dt, tuning = PLAYER, moves = PLAYER_MOVES) {
  const events = { jumped: false, landed: false, landingSpeed: 0, dashed: false, wallJumped: false, clinging: false }
  const abilities = input.abilities ?? NO_ABILITIES
  const wall = abilities.cling ? (contact.wall ?? 0) : 0

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
    state.airDashReady = true
    state.wallJumpLock = 0
    if (vy >= 0) state.isJumping = false
  } else {
    state.coyoteTimer = Math.max(0, state.coyoteTimer - dt)
  }
  state.dashCooldown = Math.max(0, state.dashCooldown - dt)
  state.wallJumpLock = Math.max(0, state.wallJumpLock - dt)

  state.jumpBufferTimer = input.jumpPressed
    ? tuning.JUMP_BUFFER_TIME
    : Math.max(0, state.jumpBufferTimer - dt)

  // Clinging: airborne, against a slimed wall, and pushing into it (or
  // already clinging and not pushing away).
  const move = state.wallJumpLock > 0 ? 0 : input.move
  const pushing = Math.sign(move)
  const clinging =
    !state.grounded &&
    wall !== 0 &&
    !isDashing(state) &&
    (pushing === wall || (state.wallSide === wall && pushing !== -wall))
  if (clinging) {
    state.wallSide = wall
    state.lastWallSide = wall
    state.wallCoyoteTimer = moves.WALL_COYOTE_TIME
    state.airDashReady = true
    events.clinging = true
  } else {
    state.wallSide = 0
    state.wallCoyoteTimer = Math.max(0, state.wallCoyoteTimer - dt)
  }

  // Starting a dash: on the ground, or once per jump in the air.
  if (
    input.dashPressed &&
    abilities.dash &&
    !isDashing(state) &&
    state.dashCooldown <= 0 &&
    (state.grounded || state.airDashReady)
  ) {
    // Off a wall, away from it; otherwise the way the player is pushing, or facing.
    state.dashDir = clinging ? -state.wallSide : pushing || input.facing || 1
    state.dashTimer = moves.DASH_TIME
    state.dashElapsed = 0
    if (!state.grounded) state.airDashReady = false
    state.isJumping = false
    state.wallSide = 0
    events.dashed = true
  }

  if (isDashing(state)) {
    state.dashTimer -= dt
    state.dashElapsed += dt
    // Never stop inside an ectoplasm barrier.
    if (state.dashTimer <= 0 && contact.insideBarrier && state.dashElapsed < moves.DASH_MAX_TIME) state.dashTimer = dt
    if (state.dashTimer > 0) {
      state.vx = state.dashDir * moves.DASH_SPEED
      state.vy = 0
      return events
    }
    state.dashTimer = 0
    state.dashCooldown = moves.DASH_COOLDOWN
    vx = state.dashDir * moves.DASH_EXIT_SPEED
    vy = 0
  }

  // Horizontal: near-instant acceleration, and turning on the ground drops
  // the old momentum entirely so reversals feel crisp. During the lock after
  // a wall jump the kick carries on untouched.
  if (state.wallJumpLock <= 0) {
    if (state.grounded && move !== 0 && vx * move < 0) vx = 0
    const accel = state.grounded
      ? move !== 0 ? tuning.GROUND_ACCEL : tuning.GROUND_DECEL
      : move !== 0 ? tuning.AIR_ACCEL : tuning.AIR_DECEL
    vx = approach(vx, move * tuning.RUN_SPEED, accel * dt)
  }

  if (state.jumpBufferTimer > 0 && state.coyoteTimer > 0) {
    vy = -tuning.JUMP_VELOCITY
    state.jumpBufferTimer = 0
    state.coyoteTimer = 0
    state.isJumping = true
    events.jumped = true
  } else if (state.jumpBufferTimer > 0 && (clinging || state.wallCoyoteTimer > 0)) {
    // Wall jump: up and away from the wall.
    const side = clinging ? state.wallSide : state.lastWallSide
    vy = -moves.WALL_JUMP_VELOCITY
    vx = -side * moves.WALL_JUMP_PUSH
    state.jumpBufferTimer = 0
    state.wallCoyoteTimer = 0
    state.wallSide = 0
    state.wallJumpLock = moves.WALL_JUMP_LOCK
    state.isJumping = true
    events.wallJumped = true
    events.clinging = false
  } else if (state.isJumping && (vy >= 0 || !input.jumpHeld)) {
    // Variable jump height: releasing early cuts the remaining rise.
    if (vy < 0) vy *= tuning.JUMP_CUT_MULTIPLIER
    state.isJumping = false
  }

  const gravity = vy > 0 ? tuning.GRAVITY * tuning.FALL_GRAVITY_MULTIPLIER : tuning.GRAVITY
  // Clinging to slime slows the slide down; rising is unaffected.
  const maxFall = state.wallSide !== 0 ? moves.WALL_SLIDE_SPEED : tuning.MAX_FALL_SPEED
  vy = Math.min(vy + gravity * dt, maxFall)

  state.vx = vx
  state.vy = vy
  return events
}
