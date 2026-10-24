import { describe, expect, it } from 'vitest'
import { GAME_HEIGHT, GAME_WIDTH } from '../constants.js'
import { anchoredY, copiesToCover, firstCopyAt, screenPosition } from './parallaxMath.js'

// Mirrors systems/ParallaxLayer.js: copies start one period before firstCopyAt.
function coveredSpan(scroll, factor, period) {
  const left = screenPosition(firstCopyAt(scroll, factor, period) - period, scroll, factor)
  return { left, right: left + copiesToCover(GAME_WIDTH, period) * period }
}

describe('repeating strips', () => {
  it.each([0, 1, 37.5, 511, 512, 1300, 4000])('cover the whole screen at scroll %s', (scroll) => {
    for (const [factor, period] of [
      [0.2, 512],
      [0.5, 512],
      [1.4, 640],
      [1.1, 256],
    ]) {
      const { left, right } = coveredSpan(scroll, factor, period)
      expect(left).toBeLessThanOrEqual(0)
      expect(right).toBeGreaterThanOrEqual(GAME_WIDTH)
    }
  })

  it('still cover the screen if the camera moved a little since the copies were laid out', () => {
    const period = 512
    for (const scroll of [0, 100, 511, 1023]) {
      const start = firstCopyAt(scroll, 1.4, period) - period
      for (const moved of [-20, 20]) {
        const left = screenPosition(start, scroll + moved, 1.4)
        expect(left).toBeLessThanOrEqual(0)
        expect(left + copiesToCover(GAME_WIDTH, period) * period).toBeGreaterThanOrEqual(GAME_WIDTH)
      }
    }
  })

  it('drift slides the strip without opening gaps', () => {
    for (const drift of [0, 13, 300, 1000]) {
      const start = firstCopyAt(200, 1, 256, drift) - 256
      const left = screenPosition(start, 200, 1)
      expect(left).toBeLessThanOrEqual(0)
      expect(left + copiesToCover(GAME_WIDTH, 256) * 256).toBeGreaterThanOrEqual(GAME_WIDTH)
    }
    expect(firstCopyAt(0, 1, 256, 10)).not.toBe(firstCopyAt(0, 1, 256, 0))
  })

  it('moves slower than the room for factors below 1 and faster above', () => {
    expect(screenPosition(0, 100, 0.2)).toBe(-20)
    expect(screenPosition(0, 100, 1.4)).toBe(-140)
  })
})

describe('anchoredY', () => {
  const layer = { anchor: 'bottom', height: 72, factorY: 1.25 }

  it('puts a bottom strip on the bottom edge with the camera at the room floor', () => {
    const maxScrollY = 530
    const y = anchoredY(layer, maxScrollY)
    expect(screenPosition(y, maxScrollY, layer.factorY) + layer.height).toBe(GAME_HEIGHT)
  })

  it('drops a foreground strip off the screen when the camera climbs a tall room', () => {
    const maxScrollY = 530
    const y = anchoredY(layer, maxScrollY)
    expect(screenPosition(y, 0, layer.factorY)).toBeGreaterThan(GAME_HEIGHT)
  })

  it('sinks a far strip only a little', () => {
    const far = { anchor: 'bottom', height: 150, factorY: 0.05 }
    const y = anchoredY(far, 530)
    const sunk = screenPosition(y, 0, far.factorY) + far.height - GAME_HEIGHT
    expect(sunk).toBeGreaterThan(0)
    expect(sunk).toBeLessThan(30)
  })

  it('pins a top strip to the top edge with the camera at the ceiling', () => {
    expect(anchoredY({ anchor: 'top', height: 56, factorY: 1.25 }, 300)).toBe(0)
  })
})
