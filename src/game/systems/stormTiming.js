import { rangeOf } from '../art/rng.js'

/** The rooftop storm's clock: when lightning strikes and how bright the sky flashes. */
export function createStorm(tuning) {
  return { untilStrike: tuning.FIRST_STRIKE_DELAY, sinceStrike: Infinity }
}

/** Advances the storm; returns true on the frame lightning strikes. */
export function stepStorm(storm, dt, rng, tuning) {
  storm.sinceStrike += dt
  storm.untilStrike -= dt
  if (storm.untilStrike > 0) return false
  storm.untilStrike = rangeOf(rng, tuning.STRIKE_MIN_DELAY, tuning.STRIKE_MAX_DELAY)
  storm.sinceStrike = 0
  return true
}

/**
 * Brightness of the lightning flash `t` seconds after a strike: a peak, a
 * quick dip, a second flicker, then a fade to nothing by FLASH_TIME.
 */
export function flashAlpha(t, tuning) {
  const { FLASH_PEAK, FLASH_SECOND_PEAK, FLASH_DIP_AT, FLASH_SECOND_AT, FLASH_TIME } = tuning
  const dip = FLASH_PEAK * 0.25
  if (t < 0 || t >= FLASH_TIME) return 0
  if (t < FLASH_DIP_AT) return FLASH_PEAK + (dip - FLASH_PEAK) * (t / FLASH_DIP_AT)
  if (t < FLASH_SECOND_AT) return dip + (FLASH_SECOND_PEAK - dip) * ((t - FLASH_DIP_AT) / (FLASH_SECOND_AT - FLASH_DIP_AT))
  const fade = 1 - (t - FLASH_SECOND_AT) / (FLASH_TIME - FLASH_SECOND_AT)
  return FLASH_SECOND_PEAK * fade * fade
}

/**
 * A jagged bolt from (x, top) down to `bottom`: flat [x0, y0, x1, y1, …] for
 * the main stroke, and sometimes a shorter branch forking off it.
 */
export function boltPath(rng, x, top, bottom, tuning) {
  const { BOLT_SEGMENTS: segments, BOLT_JITTER: jitter, BOLT_BRANCH_CHANCE } = tuning
  const main = [x, top]
  let cx = x
  for (let i = 1; i <= segments; i++) {
    cx += rangeOf(rng, -jitter, jitter)
    main.push(Math.round(cx), Math.round(top + ((bottom - top) * i) / segments))
  }
  let branch = null
  if (rng() < BOLT_BRANCH_CHANCE) {
    const from = 1 + Math.floor(rng() * (segments / 2))
    let bx = main[from * 2]
    let by = main[from * 2 + 1]
    const dir = rng() < 0.5 ? -1 : 1
    branch = [bx, by]
    for (let i = 0; i < segments / 3; i++) {
      bx += dir * rangeOf(rng, jitter * 0.4, jitter)
      by += (bottom - top) / segments
      branch.push(Math.round(bx), Math.round(by))
    }
  }
  return { main, branch }
}
