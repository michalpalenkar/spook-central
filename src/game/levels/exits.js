import { TILE } from './parseRoom.js'

// Room exits are openings in a room's border. Each exit is room data:
//   { edge: 'left' | 'right' | 'top' | 'bottom', span: [first, last], to: roomId }
// `span` is the inclusive range of tiles along that edge (rows for left and
// right, columns for top and bottom), in the room's own coordinates. Rooms
// sit at an `origin` in world tiles, so an exit lines up with the matching
// exit of the neighbour that touches that edge, and the player keeps its
// position along the edge when it walks through.

export const EDGES = ['left', 'right', 'top', 'bottom']

export const OPPOSITE_EDGE = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' }

const isVertical = (edge) => edge === 'left' || edge === 'right'

/** Length of an edge in tiles. */
function edgeLength(room, edge) {
  return isVertical(edge) ? room.height : room.width
}

/** World-tile coordinate of the line an edge lies on. */
function edgeLine(room, edge) {
  const { x, y } = room.origin
  if (edge === 'left') return x
  if (edge === 'right') return x + room.width
  if (edge === 'top') return y
  return y + room.height
}

/** World-tile offset of local tile 0 along an edge. */
function edgeStart(room, edge) {
  return isVertical(edge) ? room.origin.y : room.origin.x
}

/** The tile on a room's border at index `i` along `edge`. */
function borderTile(room, edge, i) {
  if (edge === 'left') return room.tiles[i][0]
  if (edge === 'right') return room.tiles[i][room.width - 1]
  if (edge === 'top') return room.tiles[0][i]
  return room.tiles[room.height - 1][i]
}

/** An exit's span along its edge in world tiles, as [first, last]. */
export function worldSpan(room, exit) {
  const start = edgeStart(room, exit.edge)
  return [exit.span[0] + start, exit.span[1] + start]
}

/** Which edge a point (in room pixels) has crossed, or null if inside. */
export function crossedEdge(room, x, y, tileSize) {
  if (x < 0) return 'left'
  if (x > room.width * tileSize) return 'right'
  if (y < 0) return 'top'
  if (y > room.height * tileSize) return 'bottom'
  return null
}

/** The exit on `edge` whose span contains the point (room pixels), or null. */
export function exitAt(room, edge, x, y, tileSize) {
  const along = Math.floor((isVertical(edge) ? y : x) / tileSize)
  return room.exits.find((exit) => exit.edge === edge && along >= exit.span[0] && along <= exit.span[1]) ?? null
}

/** The exit in `target` that leads back through `exit` of `room`, or null. */
export function matchingExit(room, exit, target) {
  const [first, last] = worldSpan(room, exit)
  const edge = OPPOSITE_EDGE[exit.edge]
  return (
    target.exits.find((other) => {
      if (other.edge !== edge || other.to !== room.id) return false
      const [otherFirst, otherLast] = worldSpan(target, other)
      return otherFirst <= last && otherLast >= first
    }) ?? null
  )
}

/**
 * Where a body comes out in `target` after crossing `exit` of `room`.
 *
 * `body` is { x, y, vx, vy, halfWidth, halfHeight } with the body's centre
 * in `room` pixels. Its position along the edge carries over in world space
 * (clamped to the opening it comes through), and it is placed just inside
 * the target's edge. Coming up through a floor, it gets at least
 * `tuning.ENTRY_JUMP_VELOCITY` of upward speed so it can reach the ledge
 * beside the opening.
 *
 * Returns { x, y, vx, vy } in `target` pixels.
 */
export function entryPlacement(room, exit, target, body, tileSize, tuning) {
  const dx = (room.origin.x - target.origin.x) * tileSize
  const dy = (room.origin.y - target.origin.y) * tileSize
  let x = body.x + dx
  let y = body.y + dy
  let { vy } = body
  const { halfWidth, halfHeight } = body
  const inset = tuning.ENTRY_INSET

  if (exit.edge === 'right') x = halfWidth + inset
  else if (exit.edge === 'left') x = target.width * tileSize - halfWidth - inset
  else if (exit.edge === 'bottom') y = halfHeight + inset
  else {
    y = target.height * tileSize - halfHeight - inset
    vy = Math.min(vy, -tuning.ENTRY_JUMP_VELOCITY)
  }

  // Keep the body inside the opening it comes through.
  const back = matchingExit(room, exit, target)
  const [first, last] = back ? back.span : [0, edgeLength(target, OPPOSITE_EDGE[exit.edge]) - 1]
  const clamp = (value, half) => Math.min(Math.max(value, first * tileSize + half), (last + 1) * tileSize - half)
  if (isVertical(exit.edge)) y = clamp(y, halfHeight)
  else x = clamp(x, halfWidth)

  return { x, y, vx: body.vx, vy }
}

function rangesOverlap(a0, a1, b0, b1) {
  return a0 < b1 && b0 < a1
}

/**
 * Checks that a set of parsed rooms forms a consistent world. Returns a list
 * of problems (empty when the world is valid):
 * - room ids are unique and rooms don't overlap in world space;
 * - every exit is on a real edge, inside it, and open (no solid tiles);
 * - every opening in a room's border is covered by an exit;
 * - every exit leads to a room that touches that edge, through an opening of
 *   the same size and position that leads back.
 */
export function validateWorld(rooms) {
  const problems = []
  const byId = new Map()
  for (const room of rooms) {
    if (byId.has(room.id)) problems.push(`duplicate room id "${room.id}"`)
    byId.set(room.id, room)
  }

  rooms.forEach((a, i) => {
    for (const b of rooms.slice(i + 1)) {
      const ax = a.origin.x
      const ay = a.origin.y
      const bx = b.origin.x
      const by = b.origin.y
      if (
        rangesOverlap(ax, ax + a.width, bx, bx + b.width) &&
        rangesOverlap(ay, ay + a.height, by, by + b.height)
      ) {
        problems.push(`rooms "${a.id}" and "${b.id}" overlap`)
      }
    }
  })

  for (const room of rooms) {
    const covered = Object.fromEntries(EDGES.map((edge) => [edge, new Set()]))

    for (const exit of room.exits) {
      const label = `room "${room.id}" exit ${exit.edge} [${exit.span}]`
      if (!EDGES.includes(exit.edge)) {
        problems.push(`${label}: unknown edge`)
        continue
      }
      const [first, last] = exit.span
      if (!(first <= last) || first < 0 || last >= edgeLength(room, exit.edge)) {
        problems.push(`${label}: span is outside the edge`)
        continue
      }
      for (let t = first; t <= last; t++) {
        covered[exit.edge].add(t)
        if (borderTile(room, exit.edge, t) === TILE.SOLID) problems.push(`${label}: tile ${t} is solid`)
      }

      const target = byId.get(exit.to)
      if (!target) {
        problems.push(`${label}: leads to unknown room "${exit.to}"`)
        continue
      }
      if (edgeLine(target, OPPOSITE_EDGE[exit.edge]) !== edgeLine(room, exit.edge)) {
        problems.push(`${label}: room "${target.id}" doesn't touch this edge`)
        continue
      }
      const back = matchingExit(room, exit, target)
      if (!back) {
        problems.push(`${label}: room "${target.id}" has no exit leading back`)
        continue
      }
      const [w0, w1] = worldSpan(room, exit)
      const [b0, b1] = worldSpan(target, back)
      if (w0 !== b0 || w1 !== b1) {
        problems.push(`${label}: doesn't line up with room "${target.id}" exit [${back.span}]`)
      }
    }

    for (const edge of EDGES) {
      for (let t = 0; t < edgeLength(room, edge); t++) {
        if (borderTile(room, edge, t) !== TILE.SOLID && !covered[edge].has(t)) {
          problems.push(`room "${room.id}": opening on ${edge} edge at ${t} has no exit`)
        }
      }
    }
  }

  return problems
}
