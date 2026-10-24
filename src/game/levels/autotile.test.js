import { describe, expect, it } from 'vitest'
import { EDGE, EMPTY_INDEX, PLATFORM_FRAME, edgeMask, toTileIndices } from './autotile.js'
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
