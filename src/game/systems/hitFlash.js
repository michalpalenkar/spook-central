/**
 * Short white flashes on a boss while the proton stream bites: one at the
 * first hit, then one every `INTERVAL` seconds of continuous hits, so a held
 * stream reads as a rhythm of hits instead of a strobe.
 */
export function createHitFlash() {
  return { streamTime: 0, sinceHit: Infinity }
}

/** Advances by `dt`; `hit` says whether the stream damaged the boss this frame. */
export function stepHitFlash(flash, dt, hit, tuning) {
  if (hit) {
    flash.streamTime += dt
    flash.sinceHit = 0
    return
  }
  flash.sinceHit += dt
  if (flash.sinceHit > tuning.LINGER) flash.streamTime = 0
}

/** Whether the boss should be drawn white this frame. */
export function hitFlashOn(flash, tuning) {
  return flash.sinceHit <= tuning.LINGER && flash.streamTime > 0 && flash.streamTime % tuning.INTERVAL < tuning.DURATION
}
