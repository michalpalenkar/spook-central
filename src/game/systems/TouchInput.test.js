import { describe, expect, it } from 'vitest'
import { emptyActions } from './InputState.js'
import { TouchInput } from './TouchInput.js'
import { dpadDirections, pointerActions } from './touchMapping.js'

const RADIUS = 100
const held = (directions) => Object.keys(directions).filter((d) => directions[d]).sort()

describe('dpadDirections', () => {
  it('holds nothing inside the deadzone', () => {
    expect(held(dpadDirections(5, -5, RADIUS))).toEqual([])
  })

  it('maps the four cardinal sectors (screen y grows downward)', () => {
    expect(held(dpadDirections(80, 0, RADIUS))).toEqual(['right'])
    expect(held(dpadDirections(-80, 10, RADIUS))).toEqual(['left'])
    expect(held(dpadDirections(0, -80, RADIUS))).toEqual(['up'])
    expect(held(dpadDirections(10, 80, RADIUS))).toEqual(['down'])
  })

  it('holds both directions on a diagonal', () => {
    expect(held(dpadDirections(60, -60, RADIUS))).toEqual(['right', 'up'])
    expect(held(dpadDirections(-60, 60, RADIUS))).toEqual(['down', 'left'])
  })

  it('keeps working past the pad edge', () => {
    expect(held(dpadDirections(-300, 0, RADIUS))).toEqual(['left'])
  })
})

describe('pointerActions', () => {
  const dpad = { cx: 100, cy: 100, radius: RADIUS }

  it('returns the action of the button under the finger', () => {
    expect(pointerActions({ hit: 'jump', point: { x: 0, y: 0 }, dpad, anchoredToDpad: true })).toEqual(['jump'])
  })

  it('reads directions on the D-pad', () => {
    expect(pointerActions({ hit: 'dpad', point: { x: 180, y: 100 }, dpad, anchoredToDpad: false })).toEqual(['right'])
  })

  it('keeps steering when a D-pad finger drifts off the pad', () => {
    expect(pointerActions({ hit: null, point: { x: 260, y: 100 }, dpad, anchoredToDpad: true })).toEqual(['right'])
  })

  it('ignores a finger in empty space that did not start on the D-pad', () => {
    expect(pointerActions({ hit: null, point: { x: 260, y: 100 }, dpad, anchoredToDpad: false })).toEqual([])
  })
})

describe('TouchInput', () => {
  it('merges actions held by several fingers', () => {
    const touch = new TouchInput()
    touch.setPointer(1, ['right'])
    touch.setPointer(2, ['jump'])
    touch.setPointer(3, ['fire'])
    expect(touch.poll()).toEqual({ ...emptyActions(), right: true, jump: true, fire: true })
  })

  it('releases only the lifted finger', () => {
    const touch = new TouchInput()
    touch.setPointer(1, ['left'])
    touch.setPointer(2, ['jump'])
    touch.poll()
    touch.releasePointer(2)
    expect(touch.poll()).toEqual({ ...emptyActions(), left: true })
  })

  it('moves a held action when a finger slides to another button', () => {
    const touch = new TouchInput()
    touch.setPointer(1, ['fire'])
    touch.poll()
    touch.setPointer(1, ['trap'])
    expect(touch.poll()).toEqual({ ...emptyActions(), trap: true })
  })

  it('latches a tap released before the next poll', () => {
    const touch = new TouchInput()
    touch.setPointer(1, ['jump'])
    touch.releasePointer(1)
    expect(touch.poll().jump).toBe(true)
    expect(touch.poll().jump).toBe(false)
  })

  it('releaseAll lifts every finger', () => {
    const touch = new TouchInput()
    touch.setPointer(1, ['left'])
    touch.setPointer(2, ['dash'])
    touch.poll()
    touch.releaseAll()
    expect(touch.poll()).toEqual(emptyActions())
  })
})
