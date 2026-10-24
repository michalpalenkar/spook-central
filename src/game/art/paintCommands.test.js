import { describe, expect, it } from 'vitest'
import { commandBounds, wrapOffsets } from './paintCommands.js'

describe('commandBounds', () => {
  it('covers rects, ellipses, rings, glows and point lists', () => {
    expect(commandBounds({ op: 'rect', x: 2, y: 3, w: 4, h: 5 })).toEqual({ left: 2, right: 6, top: 3, bottom: 8 })
    expect(commandBounds({ op: 'ellipse', x: 10, y: 10, rx: 3, ry: 2 })).toEqual({ left: 7, right: 13, top: 8, bottom: 12 })
    expect(commandBounds({ op: 'ring', x: 10, y: 10, rx: 3, ry: 3, width: 2 })).toEqual({ left: 6, right: 14, top: 6, bottom: 14 })
    expect(commandBounds({ op: 'glow', x: 0, y: 0, r: 5 })).toEqual({ left: -5, right: 5, top: -5, bottom: 5 })
    expect(commandBounds({ op: 'poly', points: [0, 4, 6, -2, 3, 9] })).toEqual({ left: 0, right: 6, top: -2, bottom: 9 })
  })
})

describe('wrapOffsets', () => {
  it('draws shapes inside the strip once', () => {
    expect(wrapOffsets({ left: 10, right: 20, top: 0, bottom: 5 }, 100, 50, true)).toEqual([{ dx: 0, dy: 0 }])
  })

  it('repeats a shape crossing an edge on the far side', () => {
    expect(wrapOffsets({ left: 90, right: 110, top: 0, bottom: 5 }, 100, 50, false)).toEqual([
      { dx: 0, dy: 0 },
      { dx: -100, dy: 0 },
    ])
    expect(wrapOffsets({ left: -5, right: 5, top: 0, bottom: 5 }, 100, 50, false)).toContainEqual({ dx: 100, dy: 0 })
  })

  it('wraps vertically only when asked', () => {
    const bounds = { left: 10, right: 20, top: 45, bottom: 55 }
    expect(wrapOffsets(bounds, 100, 50, false)).toHaveLength(1)
    expect(wrapOffsets(bounds, 100, 50, true)).toContainEqual({ dx: 0, dy: -50 })
  })

  it('wraps a corner both ways', () => {
    expect(wrapOffsets({ left: 95, right: 105, top: 45, bottom: 55 }, 100, 50, true)).toHaveLength(4)
  })
})
