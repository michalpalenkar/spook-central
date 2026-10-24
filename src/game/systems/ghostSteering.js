import { GHOST } from '../constants.js'

export function createSteering(phase = 0) {
  return { vx: 0, vy: 0, wanderPhase: phase, recoilTimer: 0 }
}

/** After touching the player the ghost backs off for a moment. */
export function startRecoil(steering, tuning = GHOST) {
  steering.recoilTimer = tuning.RECOIL_TIME
}

function toward(fromX, fromY, toX, toY, speed) {
  const dx = toX - fromX
  const dy = toY - fromY
  const length = Math.hypot(dx, dy)
  if (length < 1) return { x: 0, y: 0 }
  return { x: (dx / length) * speed, y: (dy / length) * speed }
}

/**
 * Picks a desired velocity for a floating ghost and eases toward it.
 * Ghosts fly through walls, so no collision is considered.
 *
 * ctx: { x, y, homeX, homeY, playerX, playerY, tethered, weakened }
 * Writes steering.vx / vy and returns the chosen behaviour for animation.
 */
export function stepSteering(steering, ctx, dt, tuning = GHOST) {
  steering.wanderPhase += tuning.WANDER_SPEED * dt
  steering.recoilTimer = Math.max(0, steering.recoilTimer - dt)

  const speedScale = ctx.weakened ? tuning.WEAKENED_SPEED_MULTIPLIER : 1
  const toPlayer = Math.hypot(ctx.playerX - ctx.x, ctx.playerY - ctx.y)
  const fromHome = Math.hypot(ctx.x - ctx.homeX, ctx.y - ctx.homeY)

  let behaviour
  let desired
  if (ctx.tethered) {
    behaviour = 'struggle'
    desired = toward(ctx.playerX, ctx.playerY, ctx.x, ctx.y, tuning.STRUGGLE_SPEED * speedScale)
  } else if (steering.recoilTimer > 0) {
    behaviour = 'recoil'
    desired = toward(ctx.playerX, ctx.playerY, ctx.x, ctx.y, tuning.RECOIL_SPEED)
  } else if (!ctx.weakened && toPlayer <= tuning.AGGRO_RANGE && fromHome <= tuning.LEASH_RANGE) {
    behaviour = 'chase'
    desired = toward(ctx.x, ctx.y, ctx.playerX, ctx.playerY, tuning.CHASE_SPEED)
  } else {
    behaviour = 'wander'
    const targetX = ctx.homeX + Math.cos(steering.wanderPhase) * tuning.WANDER_RADIUS
    const targetY = ctx.homeY + Math.sin(steering.wanderPhase * 2) * tuning.WANDER_RADIUS * 0.5
    desired = toward(ctx.x, ctx.y, targetX, targetY, tuning.HOVER_SPEED * speedScale)
  }
  if (ctx.weakened) desired.y += tuning.WEAKENED_SINK_SPEED

  const blend = Math.min(1, tuning.STEER_RATE * dt)
  steering.vx += (desired.x - steering.vx) * blend
  steering.vy += (desired.y - steering.vy) * blend
  return behaviour
}
