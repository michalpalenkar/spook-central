import { describe, expect, it } from 'vitest'
import { ABILITY } from '../systems/abilities.js'
import { SLIMER_CHASE } from './hotel.js'
import { parseRoom } from './parseRoom.js'
import { DASH_TILES, JUMP_TILES, exploreRoom, exploreWorld, reachesNear } from './reachability.js'
import { ROOMS, START_ROOM, getRoom } from './world.js'

const { PKE, DASH, BOOTS } = ABILITY
const room = (grid, exits = []) => parseRoom({ id: 'r', grid, exits })
const reaches = (r, abilities, start, x, y) => exploreRoom(r, new Set(abilities), [start]).cells.has(`${x},${y}`)

describe('reachability model', () => {
  it('derives jump height and dash length from the tuning', () => {
    expect(JUMP_TILES).toBe(4)
    expect(DASH_TILES).toBe(4)
  })

  it('jumps up to JUMP_TILES onto a ledge, but not higher', () => {
    const r = room(['########', '#......#', '#......#', '#....###', '#......#', '#......#', '#......#', '########'])
    // From the floor (feet row 6), the ledge top at row 3 is a 3-tile rise.
    expect(reaches(r, [], { x: 1, y: 6 }, 5, 2)).toBe(true)
    const tall = room(['########', '#......#', '#....###', '#......#', '#......#', '#......#', '#......#', '#......#', '########'])
    expect(reaches(tall, [], { x: 1, y: 7 }, 5, 1)).toBe(false)
  })

  it('opens spectral walls with the PKE Meter only', () => {
    const r = room(['#####', '#.H.#', '#.H.#', '#####'])
    expect(reaches(r, [], { x: 1, y: 2 }, 3, 2)).toBe(false)
    expect(reaches(r, [PKE], { x: 1, y: 2 }, 3, 2)).toBe(true)
  })

  it('stomps through weak floors with the PKE Meter only', () => {
    const r = room(['#####', '#...#', '#...#', '##B##', '#...#', '#...#', '#####'])
    expect(reaches(r, [], { x: 2, y: 2 }, 2, 5)).toBe(false)
    expect(reaches(r, [PKE], { x: 2, y: 2 }, 2, 5)).toBe(true)
  })

  it('crosses an ectoplasm barrier only by dashing', () => {
    const r = room(['#######', '#..E..#', '#..E..#', '#######'])
    expect(reaches(r, [], { x: 1, y: 2 }, 5, 2)).toBe(false)
    expect(reaches(r, [DASH], { x: 1, y: 2 }, 5, 2)).toBe(true)
  })

  it('climbs slimed walls with the Slime Boots only', () => {
    const r = room(['######', '#....#', '#....#', ...Array(7).fill('#..S##'), '######'])
    expect(reaches(r, [], { x: 1, y: 9 }, 4, 2)).toBe(false)
    expect(reaches(r, [BOOTS], { x: 1, y: 9 }, 4, 2)).toBe(true)
  })
})

describe('world progression', () => {
  const spawn = getRoom(START_ROOM).spawn
  const explore = (abilities) => exploreWorld(ROOMS, START_ROOM, [{ x: spawn.x, y: spawn.y }], new Set(abilities))
  const near = (reached, roomId, x, y, radius = 2) => reachesNear(reached.get(roomId), x, y, radius)
  const boss = (roomId) => getRoom(roomId).entities.find((e) => e.type === 'boss')
  const corridorHome = SLIMER_CHASE.at(-1).home
  const shop = getRoom('firehouse-upstairs').entities.find((e) => e.type === 'shop')

  it('reaches the Library, the Librarian and the shop with no abilities, and nothing else', () => {
    const reached = explore([])
    const areas = new Set([...reached.keys()].map((id) => getRoom(id).area))
    expect([...areas].sort()).toEqual(['firehouse', 'library'])
    const librarian = boss('library-vault')
    expect(near(reached, 'library-vault', librarian.x, 14, 6)).toBe(true)
    expect(near(reached, 'firehouse-upstairs', shop.x, shop.y, 0)).toBe(true)
  })

  it('opens the hotel and Slimer’s corridor with the PKE Meter, but not the climb', () => {
    const reached = explore([PKE])
    for (const stage of SLIMER_CHASE) expect(reached.has(stage.roomId)).toBe(true)
    expect(near(reached, 'hotel-corridor', corridorHome.x, 14, 6)).toBe(true)
    expect(reached.has('rooftop-climb')).toBe(false)
    // The barrier hides the corridor's drop back to the lobby.
    expect(near(reached, 'hotel-corridor', 53, 14, 1)).toBe(false)
  })

  it('opens the corridor shortcut with the Ecto-Dash', () => {
    expect(near(explore([PKE, DASH]), 'hotel-corridor', 53, 14, 1)).toBe(true)
  })

  it('needs both the Ecto-Dash and the Slime Boots for the rooftop climb', () => {
    const mascot = boss('rooftop-summit')
    for (const abilities of [[PKE], [PKE, DASH], [PKE, BOOTS], [DASH, BOOTS]]) {
      expect(explore(abilities).has('rooftop-summit')).toBe(false)
    }
    const reached = explore([PKE, DASH, BOOTS])
    expect(near(reached, 'rooftop-summit', mascot.x, mascot.y, 2)).toBe(true)
  })

  it('lets the player get back to the start from every room', () => {
    const all = new Set([PKE, DASH, BOOTS])
    const reached = explore([...all])
    expect(reached.size).toBe(ROOMS.length)
    for (const roomId of reached.keys()) {
      const r = getRoom(roomId)
      const starts = [...reached.get(roomId)].map((key) => {
        const [x, y] = key.split(',').map(Number)
        return { x, y }
      })
      const back = exploreWorld(ROOMS, roomId, starts, all)
      expect(back.has(START_ROOM), `stuck in ${r.id}`).toBe(true)
    }
  })
})
