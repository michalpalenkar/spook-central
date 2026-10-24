import { afterEach, describe, expect, it } from 'vitest'
import { HAPTICS } from '../constants.js'
import { canVibrate, setHapticsEnabled, vibrate } from './haptics.js'

function fakeNavigator() {
  const calls = []
  return {
    calls,
    vibrate: (pattern) => {
      calls.push(pattern)
      return true
    },
  }
}

afterEach(() => setHapticsEnabled(true))

describe('haptics', () => {
  it('vibrates with the hit pattern by default', () => {
    const nav = fakeNavigator()
    expect(vibrate(undefined, nav)).toBe(true)
    expect(nav.calls).toEqual([HAPTICS.HIT])
  })

  it('does nothing where vibrate is unsupported', () => {
    expect(canVibrate({})).toBe(false)
    expect(vibrate(HAPTICS.HIT, {})).toBe(false)
    expect(vibrate(HAPTICS.HIT, undefined)).toBe(false)
  })

  it('does nothing when disabled', () => {
    const nav = fakeNavigator()
    setHapticsEnabled(false)
    expect(vibrate(HAPTICS.HIT, nav)).toBe(false)
    expect(nav.calls).toEqual([])
  })

  it('swallows errors thrown by the browser', () => {
    const nav = {
      vibrate: () => {
        throw new Error('blocked')
      },
    }
    expect(vibrate(HAPTICS.HIT, nav)).toBe(false)
  })
})
