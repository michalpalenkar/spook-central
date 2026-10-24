import { describe, expect, it } from 'vitest'
import { circleIntersectsRect } from './overlap.js'

const rect = { x: 0, y: 0, width: 10, height: 20 }

describe('circleIntersectsRect', () => {
  it('detects a circle inside or overlapping an edge', () => {
    expect(circleIntersectsRect(5, 10, 2, rect)).toBe(true)
    expect(circleIntersectsRect(13, 10, 4, rect)).toBe(true)
  })

  it('rejects a circle beside or past a corner', () => {
    expect(circleIntersectsRect(15, 10, 4, rect)).toBe(false)
    // 3 px right and 3 px above the corner is 4.24 px away.
    expect(circleIntersectsRect(13, -3, 4, rect)).toBe(false)
    expect(circleIntersectsRect(13, -3, 4.5, rect)).toBe(true)
  })
})
