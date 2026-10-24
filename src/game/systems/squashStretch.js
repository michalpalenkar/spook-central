import { PLAYER, PLAYER_FEEL } from '../constants.js'

export function createSquash() {
  return { x: 1, y: 1 }
}

export function stretchForJump(squash) {
  squash.x = PLAYER_FEEL.JUMP_STRETCH_X
  squash.y = PLAYER_FEEL.JUMP_STRETCH_Y
}

export function squashForLanding(squash, speed, maxSpeed = PLAYER.MAX_FALL_SPEED) {
  const min = PLAYER_FEEL.LAND_SQUASH_MIN_SPEED
  const t = Math.min(1, (speed - min) / (maxSpeed - min))
  if (t <= 0) return
  squash.x = 1 + (PLAYER_FEEL.LAND_SQUASH_X - 1) * t
  squash.y = 1 + (PLAYER_FEEL.LAND_SQUASH_Y - 1) * t
}

export function relaxSquash(squash, dt) {
  const k = 1 - Math.exp(-PLAYER_FEEL.SQUASH_RECOVERY_RATE * dt)
  squash.x += (1 - squash.x) * k
  squash.y += (1 - squash.y) * k
}
