import { describe, expect, it } from 'vitest'
import { PLAYER, PLAYER_MOVES, TILE_SIZE } from '../constants.js'
import { approach, createMovementState, isDashing, stepMovement } from './movement.js'

const DT = 1 / 60

/**
 * Minimal physics stand-in: flat ground at y = 0 (up is negative), with an
 * optional ledge edge — ground only exists for x <= groundEndX.
 */
function createSim({ groundEndX = Infinity, startY = 0 } = {}) {
  const state = createMovementState()
  const body = { x: 0, y: startY, vx: 0, vy: 0 }
  let minY = startY

  const isGrounded = () => body.y >= 0 && body.x <= groundEndX

  function step(input) {
    const grounded = isGrounded()
    if (grounded) {
      body.y = 0
      if (body.vy > 0) body.vy = 0
    }
    const events = stepMovement(
      state,
      { move: 0, jumpPressed: false, jumpHeld: false, ...input },
      { grounded, vx: body.vx, vy: body.vy },
      DT,
    )
    body.vx = state.vx
    body.vy = state.vy
    body.x += body.vx * DT
    body.y += body.vy * DT
    if (body.x <= groundEndX && body.y > 0) body.y = 0
    minY = Math.min(minY, body.y)
    return events
  }

  return { state, body, step, apex: () => -minY }
}

function run(sim, frames, input) {
  const events = []
  for (let i = 0; i < frames; i++) events.push(sim.step(input))
  return events
}

describe('approach', () => {
  it('moves toward the target without overshooting', () => {
    expect(approach(0, 10, 3)).toBe(3)
    expect(approach(9, 10, 3)).toBe(10)
    expect(approach(0, -10, 3)).toBe(-3)
    expect(approach(-9, -10, 3)).toBe(-10)
  })
})

describe('horizontal movement', () => {
  it('reaches full run speed within a few frames', () => {
    const sim = createSim()
    run(sim, 4, { move: 1 })
    expect(sim.state.vx).toBe(PLAYER.RUN_SPEED)
  })

  it('stops within a few frames of releasing', () => {
    const sim = createSim()
    run(sim, 10, { move: 1 })
    run(sim, 4, {})
    expect(sim.state.vx).toBe(0)
  })

  it('drops old momentum when turning on the ground', () => {
    const sim = createSim()
    run(sim, 10, { move: 1 })
    sim.step({ move: -1 })
    expect(sim.state.vx).toBeLessThan(0)
  })
})

describe('jumping', () => {
  it('reaches about four tiles on a held jump', () => {
    const sim = createSim()
    run(sim, 2, {})
    sim.step({ jumpPressed: true, jumpHeld: true })
    run(sim, 60, { jumpHeld: true })
    expect(sim.apex()).toBeGreaterThan(4 * TILE_SIZE)
    expect(sim.apex()).toBeLessThan(5 * TILE_SIZE)
  })

  it('jumps lower when released early (variable height)', () => {
    const full = createSim()
    run(full, 2, {})
    full.step({ jumpPressed: true, jumpHeld: true })
    run(full, 60, { jumpHeld: true })

    const tap = createSim()
    run(tap, 2, {})
    tap.step({ jumpPressed: true, jumpHeld: true })
    run(tap, 60, {})

    expect(tap.apex()).toBeGreaterThan(0)
    expect(tap.apex()).toBeLessThan(full.apex() / 3)
  })

  it('caps fall speed', () => {
    const sim = createSim({ groundEndX: -1 })
    run(sim, 120, {})
    expect(sim.state.vy).toBe(PLAYER.MAX_FALL_SPEED)
  })

  it('reports the landing speed', () => {
    const sim = createSim({ startY: -3 * TILE_SIZE })
    const events = run(sim, 60, {})
    const landing = events.find((e) => e.landed)
    expect(landing.landingSpeed).toBeGreaterThan(200)
  })
})

describe('coyote time', () => {
  // Run off a ledge and press jump on the given airborne frame.
  function jumpAfterLeavingLedge(airborneFrames) {
    const sim = createSim({ groundEndX: 0 })
    sim.body.x = -4
    sim.step({})
    while (sim.body.x <= 0) sim.step({ move: 1 })
    run(sim, airborneFrames - 1, { move: 1 })
    return sim.step({ move: 1, jumpPressed: true, jumpHeld: true }).jumped
  }

  it('allows a jump shortly after leaving a ledge', () => {
    expect(jumpAfterLeavingLedge(3)).toBe(true)
  })

  it('refuses a jump once coyote time has run out', () => {
    expect(jumpAfterLeavingLedge(Math.ceil(PLAYER.COYOTE_TIME / DT) + 2)).toBe(false)
  })

  it('does not allow a second jump in the air', () => {
    const sim = createSim()
    run(sim, 2, {})
    sim.step({ jumpPressed: true, jumpHeld: true })
    run(sim, 3, { jumpHeld: true })
    expect(sim.step({ jumpPressed: true, jumpHeld: true }).jumped).toBe(false)
  })
})

describe('jump buffering', () => {
  // Fall from a height and press jump `framesBefore` frames before landing.
  function bufferedJump(framesBefore) {
    const probe = createSim({ startY: -3 * TILE_SIZE })
    const landingFrame = run(probe, 120, {}).findIndex((e) => e.landed)

    const sim = createSim({ startY: -3 * TILE_SIZE })
    const pressFrame = landingFrame - framesBefore
    let jumped = false
    for (let i = 0; i <= landingFrame + 1; i++) {
      const events = sim.step({ jumpPressed: i === pressFrame, jumpHeld: i >= pressFrame })
      if (i >= landingFrame && events.jumped) jumped = true
    }
    return jumped
  }

  it('jumps on landing when pressed just before touching down', () => {
    expect(bufferedJump(4)).toBe(true)
  })

  it('ignores a press made too long before landing', () => {
    expect(bufferedJump(Math.ceil(PLAYER.JUMP_BUFFER_TIME / DT) + 3)).toBe(false)
  })
})

// Ability movement: a free body with optional walls, for dash and wall jump.
// `wallLeftX` is a slimed wall's face on the left (bodies stop there), and
// the ground is at y = 0 when `ground` is set.
function createAbilitySim({ ground = false, wallLeftX = null, startY = -100, abilities = { dash: true, cling: true } } = {}) {
  const state = createMovementState()
  const body = { x: 0, y: startY, vx: 0, vy: 0 }
  function step(input = {}, contact = {}) {
    const grounded = ground && body.y >= 0
    if (grounded) {
      body.y = 0
      if (body.vy > 0) body.vy = 0
    }
    const touchingWall = wallLeftX !== null && body.x <= wallLeftX + 0.5
    if (touchingWall && body.vx < 0) body.vx = 0
    const events = stepMovement(
      state,
      { move: 0, jumpPressed: false, jumpHeld: false, dashPressed: false, facing: 1, abilities, ...input },
      { grounded, vx: body.vx, vy: body.vy, wall: touchingWall ? -1 : 0, insideBarrier: false, ...contact },
      DT,
    )
    body.vx = state.vx
    body.vy = state.vy
    body.x += body.vx * DT
    body.y += body.vy * DT
    if (wallLeftX !== null) body.x = Math.max(body.x, wallLeftX)
    if (ground && body.y > 0) body.y = 0
    return events
  }
  return { state, body, step }
}

describe('Ecto-Dash', () => {
  it('dashes about four tiles in the facing direction, ignoring gravity', () => {
    const sim = createAbilitySim()
    const y0 = sim.body.y
    expect(sim.step({ dashPressed: true, facing: -1 }).dashed).toBe(true)
    for (let i = 0; i < 9; i++) sim.step()
    expect(sim.body.x).toBeCloseTo(-PLAYER_MOVES.DASH_SPEED * PLAYER_MOVES.DASH_TIME, -1)
    expect(sim.body.y).toBe(y0)
    expect(-sim.body.x / TILE_SIZE).toBeGreaterThan(4)
  })

  it('goes the way the player is pushing rather than facing', () => {
    const sim = createAbilitySim()
    sim.step({ dashPressed: true, facing: 1, move: -1 })
    expect(sim.state.vx).toBeLessThan(0)
  })

  it('works once in the air, and again after landing', () => {
    const air = createAbilitySim()
    expect(air.step({ dashPressed: true }).dashed).toBe(true)
    run(air, 30)
    expect(air.state.grounded).toBe(false)
    expect(air.step({ dashPressed: true }).dashed).toBe(false)

    const sim = createAbilitySim({ ground: true, startY: -40 })
    sim.step({ dashPressed: true })
    run(sim, 60)
    expect(sim.state.grounded).toBe(true)
    expect(sim.step({ dashPressed: true }).dashed).toBe(true)
  })

  it('waits out its cooldown on the ground', () => {
    const sim = createAbilitySim({ ground: true, startY: 0 })
    sim.step({ dashPressed: true })
    run(sim, 11)
    expect(sim.step({ dashPressed: true }).dashed).toBe(false)
    run(sim, 20)
    expect(sim.step({ dashPressed: true }).dashed).toBe(true)
  })

  it('needs the ability', () => {
    const sim = createAbilitySim({ abilities: { dash: false, cling: false } })
    expect(sim.step({ dashPressed: true }).dashed).toBe(false)
  })

  it('keeps going while inside an ectoplasm barrier, up to a limit', () => {
    const sim = createAbilitySim()
    sim.step({ dashPressed: true })
    let frames = 1
    while (isDashing(sim.state) && frames < 60) {
      sim.step({}, { insideBarrier: true })
      frames++
    }
    expect(frames * DT).toBeGreaterThan(PLAYER_MOVES.DASH_TIME + 0.05)
    expect(frames * DT).toBeLessThanOrEqual(PLAYER_MOVES.DASH_MAX_TIME + 2 * DT)
  })
})

describe('Slime Boots', () => {
  it('cling to a slimed wall when pushing into it, capping the slide', () => {
    const sim = createAbilitySim({ wallLeftX: 0 })
    run(sim, 40, { move: -1 })
    expect(sim.state.wallSide).toBe(-1)
    expect(sim.state.vy).toBeLessThanOrEqual(PLAYER_MOVES.WALL_SLIDE_SPEED)
  })

  it('do nothing without the ability', () => {
    const sim = createAbilitySim({ wallLeftX: 0, abilities: { dash: false, cling: false } })
    run(sim, 40, { move: -1 })
    expect(sim.state.wallSide).toBe(0)
    expect(sim.state.vy).toBeGreaterThan(PLAYER_MOVES.WALL_SLIDE_SPEED)
  })

  it('wall-jump up and away from the wall, ignoring input briefly', () => {
    const sim = createAbilitySim({ wallLeftX: 0 })
    run(sim, 10, { move: -1 })
    const events = sim.step({ move: -1, jumpPressed: true, jumpHeld: true })
    expect(events.wallJumped).toBe(true)
    expect(sim.state.vx).toBe(PLAYER_MOVES.WALL_JUMP_PUSH)
    expect(sim.state.vy).toBeLessThan(-PLAYER_MOVES.WALL_JUMP_VELOCITY + 30)
    sim.step({ move: -1, jumpHeld: true })
    expect(sim.state.vx).toBe(PLAYER_MOVES.WALL_JUMP_PUSH)
  })

  it('allow a wall jump just after letting go', () => {
    const sim = createAbilitySim({ wallLeftX: 0 })
    run(sim, 10, { move: -1 })
    sim.step({ move: 1 })
    expect(sim.state.wallSide).toBe(0)
    expect(sim.step({ jumpPressed: true, jumpHeld: true }).wallJumped).toBe(true)
  })

  it('can climb a single slimed wall by jumping while holding toward it', () => {
    const sim = createAbilitySim({ wallLeftX: 0 })
    run(sim, 5, { move: -1 })
    const start = sim.body.y
    for (let i = 0; i < 6; i++) {
      sim.step({ move: -1, jumpPressed: true, jumpHeld: true })
      run(sim, 22, { move: -1, jumpHeld: true })
      run(sim, 4, { move: -1 })
    }
    expect(start - sim.body.y).toBeGreaterThan(5 * TILE_SIZE)
  })

  it('refresh the air dash while clinging', () => {
    const sim = createAbilitySim({ wallLeftX: 0 })
    sim.step({ dashPressed: true, facing: 1 })
    run(sim, 30)
    expect(sim.state.airDashReady).toBe(false)
    run(sim, 60, { move: -1 })
    expect(sim.state.wallSide).toBe(-1)
    expect(sim.state.airDashReady).toBe(true)
  })
})
