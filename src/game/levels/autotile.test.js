import { describe, expect, it } from 'vitest'
import { BARRIER_FRAME, EDGE, EMPTY_INDEX, PLATFORM_FRAME, SKY_FRAME, SLIME_FRAME_START, TILESET_FRAME_COUNT, edgeMask, isSlimeFrame, toTileIndices } from './autotile.js'
import { parseRoom } from './parseRoom.js'

const tilesOf = (grid) => parseRoom({ id: 't', grid }).tiles

describe('edgeMask', () => {
  it('marks sides that face open space', () => {
    const tiles = tilesOf(['P....', '.###.', '.....'])
    expect(edgeMask(tiles, 1, 1)).toBe(EDGE.TOP | EDGE.BOTTOM | EDGE.LEFT)
    expect(edgeMask(tiles, 2, 1)).toBe(EDGE.TOP | EDGE.BOTTOM)
    expect(edgeMask(tiles, 3, 1)).toBe(EDGE.TOP | EDGE.BOTTOM | EDGE.RIGHT)
  })

  it('treats the room border as solid', () => {
    const tiles = tilesOf(['###', '#P#'])
    expect(edgeMask(tiles, 0, 0)).toBe(0)
    expect(edgeMask(tiles, 1, 0)).toBe(EDGE.BOTTOM)
  })

  it('does not treat platforms as solid neighbours', () => {
    const tiles = tilesOf(['P=', '.#'])
    expect(edgeMask(tiles, 1, 1) & EDGE.TOP).toBe(EDGE.TOP)
  })
})

describe('toTileIndices', () => {
  it('maps empty, platform and solid tiles to tileset frames', () => {
    const indices = toTileIndices(tilesOf(['P=', '##']))
    expect(indices).toEqual([
      [EMPTY_INDEX, PLATFORM_FRAME],
      [EDGE.TOP, EDGE.TOP],
    ])
  })
})

describe('gate tiles', () => {
  it('draw spectral walls and weak floors as brick, joined with their neighbours', () => {
    const indices = toTileIndices(tilesOf(['P..', '#HB']))
    expect(indices[1]).toEqual([EDGE.TOP, EDGE.TOP, EDGE.TOP])
  })

  it('draw slimed walls from their own frames, with the same edge masks', () => {
    const indices = toTileIndices(tilesOf(['P.', '#S']))
    expect(indices[1][1]).toBe(SLIME_FRAME_START + EDGE.TOP)
    expect(isSlimeFrame(indices[1][1])).toBe(true)
    expect(isSlimeFrame(indices[1][0])).toBe(false)
  })

  it('draw barriers as one frame that leaves walls next to them exposed', () => {
    const tiles = tilesOf(['P#E'])
    expect(toTileIndices(tiles)[0][2]).toBe(BARRIER_FRAME)
    expect(edgeMask(tiles, 1, 0) & EDGE.RIGHT).toBe(EDGE.RIGHT)
  })
})


describe('open sky', () => {
  it('uses the transparent sky frame, and walls beneath it show their top edge', () => {
    const { tiles } = parseRoom({ id: 'r', grid: ['^^^', '#.#', '###'] })
    const indices = toTileIndices(tiles)
    expect(indices[0]).toEqual([SKY_FRAME, SKY_FRAME, SKY_FRAME])
    expect(edgeMask(tiles, 0, 1) & EDGE.TOP).toBe(EDGE.TOP)
    expect(SKY_FRAME).toBe(TILESET_FRAME_COUNT - 1)
  })
})
