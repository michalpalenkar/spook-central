import { describe, expect, it } from 'vitest'
import { PROJECTILE } from '../constants.js'
import { parseRoom } from '../levels/parseRoom.js'
import { PROJECTILE_KIND, createProjectile, stepProjectile } from './projectile.js'

const T = 16
const DT = 1 / 60
// A 10×6 room: floor at row 5 with a pit at column 6, a wall at column 9.
const tiles = parseRoom({ id: 'p', grid: ['##########', '#........#', '#........#', '#........#', '#........#', '######.###'] }).tiles

function fly(p, seconds) {
  for (let t = 0; t < seconds && !p.dead; t += DT) stepProjectile(p, DT, tiles, T)
  return p
}

describe('projectiles', () => {
  it('books fly straight and burst on walls', () => {
    const book = createProjectile(PROJECTILE_KIND.BOOK, 40, 40, 100, 0)
    stepProjectile(book, DT, tiles, T)
    expect(book.y).toBe(40)
    fly(book, 2)
    expect(book).toMatchObject({ dead: true, burst: true })
    expect(book.x).toBeGreaterThan(8 * T)
  })

  it('globs fall under gravity onto the floor', () => {
    const glob = createProjectile(PROJECTILE_KIND.GLOB, 40, 20, 0, 0)
    fly(glob, 2)
    expect(glob.burst).toBe(true)
    expect(glob.y).toBeGreaterThanOrEqual(5 * T)
  })

  it('shockwaves run along the floor and stop at a drop', () => {
    const wave = createProjectile(PROJECTILE_KIND.SHOCKWAVE, 40, 5 * T - PROJECTILE.SHOCKWAVE_HEIGHT, PROJECTILE.SHOCKWAVE_SPEED, 0)
    fly(wave, 2)
    expect(wave.dead).toBe(true)
    expect(Math.floor(wave.x / T)).toBe(6)
  })

  it('expire after their lifetime', () => {
    const book = createProjectile(PROJECTILE_KIND.BOOK, 40, 40, 0, 0)
    fly(book, PROJECTILE.BOOK_LIFETIME + DT)
    expect(book).toMatchObject({ dead: true, burst: false })
  })
})
