import { describe, expect, it } from 'vitest'
import { PLATFORM_LANDING_TOLERANCE } from '../constants.js'
import { canLandOnPlatform } from './oneWayPlatform.js'

describe('canLandOnPlatform', () => {
  it('catches a falling body whose feet started above the top', () => {
    expect(canLandOnPlatform(95, 100, 200)).toBe(true)
    expect(canLandOnPlatform(100 + PLATFORM_LANDING_TOLERANCE, 100, 0)).toBe(true)
  })

  it('lets rising bodies pass through', () => {
    expect(canLandOnPlatform(95, 100, -50)).toBe(false)
  })

  it('ignores bodies that were already below the top', () => {
    expect(canLandOnPlatform(110, 100, 200)).toBe(false)
  })
})
