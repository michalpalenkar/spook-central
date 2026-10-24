import { describe, expect, it } from 'vitest'
import { TILE, parseRoom } from '../levels/parseRoom.js'
import {
  ABILITY,
  connectedTiles,
  effectiveTiles,
  grantAbility,
  overlapsBarrier,
  slimeContact,
  tileKey,
  weakFloorUnderfoot,
} from './abilities.js'

const tilesOf = (grid) => parseRoom({ id: 't', grid }).tiles
const T = 16

describe('grantAbility', () => {
  it('adds a known ability once', () => {
    const session = { abilities: new Set() }
    expect(grantAbility(session, ABILITY.PKE)).toBe(true)
    expect(grantAbility(session, ABILITY.PKE)).toBe(false)
    expect(grantAbility(session, 'jetpack')).toBe(false)
    expect([...session.abilities]).toEqual([ABILITY.PKE])
  })
})

describe('effectiveTiles', () => {
  const tiles = tilesOf(['#H.', '#BB'])

  it('keeps spectral walls without the PKE Meter and drops them with it', () => {
    expect(effectiveTiles(tiles, new Set())[0][1]).toBe(TILE.SPECTRAL)
    expect(effectiveTiles(tiles, new Set([ABILITY.PKE]))[0][1]).toBe(TILE.EMPTY)
  })

  it('empties weak floors broken this session, and never changes the room', () => {
    const result = effectiveTiles(tiles, new Set(), new Set([tileKey(1, 1)]))
    expect(result[1]).toEqual([TILE.SOLID, TILE.EMPTY, TILE.WEAK_FLOOR])
    expect(tiles[1][1]).toBe(TILE.WEAK_FLOOR)
  })
})

describe('connectedTiles', () => {
  it('finds a 4-connected group of one tile type', () => {
    const tiles = tilesOf(['BB.B', '.B..', '....'])
    const group = connectedTiles(tiles, 0, 0, TILE.WEAK_FLOOR)
    expect(group.map(({ x, y }) => tileKey(x, y)).sort()).toEqual(['0,0', '1,0', '1,1'])
    expect(connectedTiles(tiles, 2, 0, TILE.WEAK_FLOOR)).toEqual([])
  })
})

describe('weakFloorUnderfoot', () => {
  const tiles = tilesOf(['....', '....', '#BB#'])
  const feet = (left, right) => ({ left, right, y: 2 * T })

  it('needs the PKE Meter', () => {
    expect(weakFloorUnderfoot(tiles, new Set(), feet(18, 28), T)).toBeNull()
    expect(weakFloorUnderfoot(tiles, new Set([ABILITY.PKE]), feet(18, 28), T)).toEqual({ x: 1, y: 2 })
  })

  it('counts a body only partly over the weak floor', () => {
    expect(weakFloorUnderfoot(tiles, new Set([ABILITY.PKE]), feet(10, 20), T)).toEqual({ x: 1, y: 2 })
    expect(weakFloorUnderfoot(tiles, new Set([ABILITY.PKE]), feet(2, 12), T)).toBeNull()
  })
})

describe('slimeContact', () => {
  const tiles = tilesOf(['S..#', 'S..#', 'S..#'])

  it('reports the side touching a slimed wall, within reach', () => {
    expect(slimeContact(tiles, { x: 16, y: 4, width: 10, height: 22 }, T)).toBe(-1)
    expect(slimeContact(tiles, { x: 18, y: 4, width: 10, height: 22 }, T)).toBe(0)
  })

  it('ignores plain brick', () => {
    expect(slimeContact(tiles, { x: 38, y: 4, width: 10, height: 22 }, T)).toBe(0)
  })
})

describe('overlapsBarrier', () => {
  it('is true only while the body overlaps ectoplasm', () => {
    const tiles = tilesOf(['.E.', '.E.'])
    expect(overlapsBarrier(tiles, { x: 10, y: 0, width: 10, height: 22 }, T)).toBe(true)
    expect(overlapsBarrier(tiles, { x: 0, y: 0, width: 10, height: 22 }, T)).toBe(false)
  })
})
