import { PLAYER_COMBAT } from '../constants.js'
import { FIREHOUSE_ROOMS } from './firehouse.js'
import { HOTEL_ROOMS } from './hotel.js'
import { LIBRARY_ROOMS } from './library.js'
import { parseRoom } from './parseRoom.js'
import { ROOFTOP_ROOMS } from './rooftop.js'

// Every connected room in the game. levels/testRoom.js stays out of the
// world on purpose: it is a dev sandbox, reachable with `?room=test-room`.

export const AREAS = {
  firehouse: { name: 'Firehouse' },
  library: { name: 'NY Public Library' },
  hotel: { name: 'Sedgewick Hotel' },
  rooftop: { name: 'Spook Central' },
}

export const START_ROOM = 'firehouse-garage'

export const ROOM_DEFINITIONS = [...FIREHOUSE_ROOMS, ...LIBRARY_ROOMS, ...HOTEL_ROOMS, ...ROOFTOP_ROOMS]

export const ROOMS = ROOM_DEFINITIONS.map(parseRoom)

const ROOMS_BY_ID = new Map(ROOMS.map((room) => [room.id, room]))

export function getRoom(id) {
  return ROOMS_BY_ID.get(id) ?? null
}

/** What the save and session code needs to know about the world. */
export const WORLD_INFO = {
  roomIds: new Set(ROOMS_BY_ID.keys()),
  startRoom: START_ROOM,
  defaultMaxHp: PLAYER_COMBAT.MAX_HP,
}
