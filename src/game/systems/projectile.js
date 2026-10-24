import { PROJECTILE, TILE_SIZE } from '../constants.js'
import { isSolidAt } from './lineOfSight.js'

// Boss projectiles: the Librarian's books fly straight, the mascot's globs
// arc under gravity, and his stomp sends shockwaves running along the floor.
// Books and globs burst on walls; shockwaves stop at a wall or a drop.

export const PROJECTILE_KIND = {
  BOOK: 'book',
  GLOB: 'glob',
  SHOCKWAVE: 'shockwave',
}

const SPECS = {
  [PROJECTILE_KIND.BOOK]: { radius: PROJECTILE.BOOK_RADIUS, gravity: 0, lifetime: PROJECTILE.BOOK_LIFETIME },
  [PROJECTILE_KIND.GLOB]: { radius: PROJECTILE.GLOB_RADIUS, gravity: PROJECTILE.GLOB_GRAVITY, lifetime: PROJECTILE.GLOB_LIFETIME },
  [PROJECTILE_KIND.SHOCKWAVE]: { radius: PROJECTILE.SHOCKWAVE_RADIUS, gravity: 0, lifetime: PROJECTILE.SHOCKWAVE_LIFETIME },
}

export function createProjectile(kind, x, y, vx, vy) {
  return { kind, x, y, vx, vy, age: 0, dead: false, burst: false, ...SPECS[kind] }
}

/**
 * Moves a projectile one frame. Sets `dead` when it expires or hits
 * something, and `burst` too when it hit a wall or floor (for a splash).
 */
export function stepProjectile(p, dt, tiles, tileSize = TILE_SIZE) {
  if (p.dead) return
  p.age += dt
  if (p.age >= p.lifetime) {
    p.dead = true
    return
  }
  p.vy += p.gravity * dt
  p.x += p.vx * dt
  p.y += p.vy * dt

  if (p.kind === PROJECTILE_KIND.SHOCKWAVE) {
    const ahead = p.x + Math.sign(p.vx) * p.radius
    const blocked = isSolidAt(tiles, ahead, p.y, tileSize)
    const floorGone = !isSolidAt(tiles, p.x, p.y + tileSize / 2 + 1, tileSize)
    if (blocked || floorGone) p.dead = true
    return
  }
  if (isSolidAt(tiles, p.x, p.y, tileSize)) {
    p.dead = true
    p.burst = true
  }
}
