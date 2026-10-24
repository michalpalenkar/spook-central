import { SLIMER } from '../constants.js'

// Slimer's flight through the hotel. The chase is a list of stages, one per
// room (levels/hotel.js): in each he waits at a waypoint until the player
// comes close, flies to the next one, and past the last one leaves for the
// next stage's room. The last stage has a `home` instead of waypoints: there
// he is cornered and fights like a ghost. The session keeps `chaseStage`,
// the stage he is waiting in.

export const CHASE_MODE = {
  WAITING: 'waiting',
  FLEEING: 'fleeing',
  GONE: 'gone',
  CORNERED: 'cornered',
}

/**
 * What Slimer is doing when the player walks into `roomId`, or null if he
 * isn't there. A player who gets ahead of him (say, by stomping through the
 * ballroom floor before meeting him) finds him waiting in the room they
 * reach: the chase skips ahead, never back.
 *
 * Returns { stage, cornered } and updates `progress.stage`.
 */
export function slimerInRoom(progress, stages, roomId) {
  const index = stages.findIndex((s) => s.roomId === roomId)
  if (index < 0 || index < progress.stage) return null
  progress.stage = index
  return { stage: index, cornered: !stages[index].waypoints }
}

/** A fleeing Slimer at the first waypoint of a stage (waypoints in px). */
export function createFlight(waypoints) {
  return { mode: CHASE_MODE.WAITING, waypoint: 0, x: waypoints[0].x, y: waypoints[0].y }
}

/**
 * Advances a fleeing Slimer. `player` is { x, y } in px. Returns
 * { fled, left }: `fled` when he starts flying to the next waypoint, `left`
 * when he passes the last one and leaves the room.
 */
export function stepFlight(flight, waypoints, player, dt, tuning = SLIMER) {
  const events = { fled: false, left: false }
  if (flight.mode === CHASE_MODE.WAITING) {
    if (Math.hypot(player.x - flight.x, player.y - flight.y) <= tuning.FLEE_RANGE) {
      flight.mode = CHASE_MODE.FLEEING
      events.fled = true
    }
    return events
  }
  if (flight.mode !== CHASE_MODE.FLEEING) return events

  const target = waypoints[flight.waypoint + 1]
  const dx = target.x - flight.x
  const dy = target.y - flight.y
  const distance = Math.hypot(dx, dy)
  const step = tuning.FLEE_SPEED * dt
  if (distance <= Math.max(step, tuning.ARRIVE_DISTANCE)) {
    flight.x = target.x
    flight.y = target.y
    flight.waypoint++
    if (flight.waypoint === waypoints.length - 1) {
      flight.mode = CHASE_MODE.GONE
      events.left = true
    } else {
      flight.mode = CHASE_MODE.WAITING
    }
    return events
  }
  flight.x += (dx / distance) * step
  flight.y += (dy / distance) * step
  return events
}

/** Called when Slimer leaves his stage's room: he now waits in the next one. */
export function advanceChase(progress, stage) {
  progress.stage = Math.max(progress.stage, stage + 1)
}
