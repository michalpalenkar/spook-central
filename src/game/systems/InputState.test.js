import { describe, expect, it } from 'vitest'
import { ACTIONS, InputState, emptyActions } from './InputState.js'
import { KEY_BINDINGS, readActions } from './keyBindings.js'

const source = (initial = {}) => {
  const held = { ...emptyActions(), ...initial }
  return { held, poll: () => held }
}

describe('InputState', () => {
  it('combines sources: an action is down if any source holds it', () => {
    const a = source({ jump: true })
    const b = source({ left: true })
    const input = new InputState()
    input.addSource(a)
    input.addSource(b)
    input.update()
    expect(input.isDown('jump')).toBe(true)
    expect(input.isDown('left')).toBe(true)
    expect(input.isDown('fire')).toBe(false)
  })

  it('reports press and release edges for one frame', () => {
    const s = source()
    const input = new InputState()
    input.addSource(s)

    s.held.jump = true
    input.update()
    expect(input.justPressed('jump')).toBe(true)
    input.update()
    expect(input.justPressed('jump')).toBe(false)
    expect(input.isDown('jump')).toBe(true)

    s.held.jump = false
    input.update()
    expect(input.justReleased('jump')).toBe(true)
  })

  it('resolves horizontal direction, cancelling opposite keys', () => {
    const s = source()
    const input = new InputState()
    input.addSource(s)
    input.update()
    expect(input.horizontal).toBe(0)
    s.held.left = true
    input.update()
    expect(input.horizontal).toBe(-1)
    s.held.right = true
    input.update()
    expect(input.horizontal).toBe(0)
  })
})

describe('keyboard bindings', () => {
  it('binds every action', () => {
    expect(Object.keys(KEY_BINDINGS).sort()).toEqual([...ACTIONS].sort())
  })

  it('maps keys to actions as documented in CLAUDE.md', () => {
    const down = new Set(['Z', 'LEFT', 'SHIFT'])
    const actions = readActions(KEY_BINDINGS, (key) => down.has(key))
    expect(actions).toEqual({ ...emptyActions(), jump: true, left: true, dash: true })
  })

  it('counts updates', () => {
    const input = new InputState()
    expect(input.frame).toBe(0)
    input.update()
    input.update()
    expect(input.frame).toBe(2)
  })
})
