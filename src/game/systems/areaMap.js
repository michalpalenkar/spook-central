import { isWallTile } from '../levels/parseRoom.js'
import { worldSpan } from '../levels/exits.js'

// The area map fills itself in: a room shows up once the player has been in
// it, drawn as the shape of its open space. Exits from known rooms into
// unknown ones show as stubs, hinting where to explore next. Everything is in
// world tiles; the React overlay scales it to fit.

/**
 * The open (non-solid) space of a tile grid as rectangles: runs of open
 * tiles per row, with identical runs in consecutive rows merged.
 */
export function openRects(tiles) {
  const rects = []
  let previous = new Map()
  tiles.forEach((row, y) => {
    const current = new Map()
    let x = 0
    while (x < row.length) {
      if (isWallTile(row[x])) {
        x++
        continue
      }
      const start = x
      while (x < row.length && !isWallTile(row[x])) x++
      const key = `${start}:${x - start}`
      const above = previous.get(key)
      if (above) {
        above.height++
        current.set(key, above)
      } else {
        const rect = { x: start, y, width: x - start, height: 1 }
        rects.push(rect)
        current.set(key, rect)
      }
    }
    previous = current
  })
  return rects
}

const rectCache = new WeakMap()

function cachedOpenRects(room) {
  if (!rectCache.has(room.tiles)) rectCache.set(room.tiles, openRects(room.tiles))
  return rectCache.get(room.tiles)
}

/** Where an exit sits on the map: a segment along the room's edge, in world tiles. */
function doorSegment(room, exit) {
  const [first, last] = worldSpan(room, exit)
  const { x, y } = room.origin
  if (exit.edge === 'left') return { x1: x, y1: first, x2: x, y2: last + 1 }
  if (exit.edge === 'right') return { x1: x + room.width, y1: first, x2: x + room.width, y2: last + 1 }
  if (exit.edge === 'top') return { x1: first, y1: y, x2: last + 1, y2: y }
  return { x1: first, y1: y + room.height, x2: last + 1, y2: y + room.height }
}

/** The base of the room's fire pole in world tiles, or null. */
function polePosition(room) {
  const pole = room.entities.find((e) => e.type === 'pole')
  return pole ? { x: room.origin.x + pole.x + 0.5, y: room.origin.y + pole.y + 1 } : null
}

/**
 * Builds what the map overlay draws.
 *
 * - rooms: parsed rooms (with `origin`), in any order.
 * - state: { visited: Set, currentRoomId, player: { x, y } in room pixels or
 *   null, saveRoomId }.
 *
 * Returns { bounds, rooms, doors, player }, all in world tiles. `bounds`
 * covers the visited rooms (null when none are).
 */
export function buildMapView(rooms, { visited, currentRoomId, player = null, saveRoomId = null }, tileSize) {
  const byId = new Map(rooms.map((room) => [room.id, room]))
  const known = rooms.filter((room) => visited.has(room.id))

  const mapRooms = known.map((room) => ({
    id: room.id,
    name: room.name,
    area: room.area,
    x: room.origin.x,
    y: room.origin.y,
    width: room.width,
    height: room.height,
    open: cachedOpenRects(room),
    current: room.id === currentRoomId,
    pole: polePosition(room),
    saved: room.id === saveRoomId,
  }))

  // Each door between two known rooms is listed once; doors into unknown
  // rooms are listed as unexplored.
  const doors = []
  for (const room of known) {
    for (const exit of room.exits) {
      const explored = visited.has(exit.to)
      if (explored && exit.to < room.id) continue
      if (!byId.has(exit.to)) continue
      doors.push({ ...doorSegment(room, exit), from: room.id, to: exit.to, explored })
    }
  }

  let bounds = null
  for (const room of mapRooms) {
    const x2 = room.x + room.width
    const y2 = room.y + room.height
    bounds = bounds
      ? {
          x: Math.min(bounds.x, room.x),
          y: Math.min(bounds.y, room.y),
          x2: Math.max(bounds.x2, x2),
          y2: Math.max(bounds.y2, y2),
        }
      : { x: room.x, y: room.y, x2, y2 }
  }
  if (bounds) bounds = { x: bounds.x, y: bounds.y, width: bounds.x2 - bounds.x, height: bounds.y2 - bounds.y }

  const current = byId.get(currentRoomId)
  const marker =
    player && current
      ? { x: current.origin.x + player.x / tileSize, y: current.origin.y + player.y / tileSize }
      : null

  return { bounds, rooms: mapRooms, doors, player: marker }
}
