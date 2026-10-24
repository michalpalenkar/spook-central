import { describe, expect, it } from 'vitest'
import { GAMEPAD } from '../constants.js'
import { ACTIONS, emptyActions } from './InputState.js'
import { GamepadInput } from './GamepadInput.js'
import { GAMEPAD_BINDINGS, STANDARD_BUTTONS, readGamepad } from './gamepadBindings.js'

function pad({ pressed = [], values = {}, axes = [0, 0, 0, 0], connected = true } = {}) {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }))
  for (const name of pressed) buttons[STANDARD_BUTTONS[name]] = { pressed: true, value: 1 }
  for (const [name, value] of Object.entries(values)) {
    buttons[STANDARD_BUTTONS[name]] = { pressed: value > 0, value }
  }
  return { buttons, axes, connected }
}

describe('gamepad bindings', () => {
  it('binds every action', () => {
    expect(Object.keys(GAMEPAD_BINDINGS).sort()).toEqual([...ACTIONS].sort())
  })

  it('maps face buttons, bumpers and Start as documented in CLAUDE.md', () => {
    expect(readGamepad(pad({ pressed: ['A', 'Y', 'START'] }))).toEqual({
      ...emptyActions(),
      jump: true,
      trap: true,
      pause: true,
    })
    expect(readGamepad(pad({ pressed: ['X'] })).fire).toBe(true)
    expect(readGamepad(pad({ pressed: ['B'] })).dash).toBe(true)
    expect(readGamepad(pad({ pressed: ['RB'] })).dash).toBe(true)
  })

  it('maps the D-pad to directions', () => {
    expect(readGamepad(pad({ pressed: ['DPAD_LEFT', 'DPAD_UP'] }))).toEqual({
      ...emptyActions(),
      left: true,
      up: true,
    })
  })

  it('fires on the right trigger only past its threshold', () => {
    expect(readGamepad(pad({ values: { RT: GAMEPAD.TRIGGER_THRESHOLD / 2 } })).fire).toBe(false)
    expect(readGamepad(pad({ values: { RT: 1 } })).fire).toBe(true)
  })
})

describe('left stick', () => {
  it('ignores small deflections inside the deadzone', () => {
    const small = GAMEPAD.STICK_DEADZONE * 0.9
    expect(readGamepad(pad({ axes: [small, -small] }))).toEqual(emptyActions())
  })

  it('maps deflection to directions (axis 1 negative is up)', () => {
    expect(readGamepad(pad({ axes: [-0.9, 0] })).left).toBe(true)
    expect(readGamepad(pad({ axes: [0.9, 0] })).right).toBe(true)
    expect(readGamepad(pad({ axes: [0, -0.9] })).up).toBe(true)
    expect(readGamepad(pad({ axes: [0, 0.9] })).down).toBe(true)
  })

  it('holds two directions on a diagonal', () => {
    const actions = readGamepad(pad({ axes: [0.7, 0.7] }))
    expect(actions.right && actions.down).toBe(true)
  })
})

describe('GamepadInput', () => {
  it('merges all connected pads and skips empty slots', () => {
    const pads = [null, pad({ pressed: ['A'] }), pad({ axes: [-1, 0] }), pad({ pressed: ['X'], connected: false })]
    const input = new GamepadInput(() => pads)
    expect(input.poll()).toEqual({ ...emptyActions(), jump: true, left: true })
  })

  it('reads nothing when the Gamepad API is missing', () => {
    expect(new GamepadInput(() => []).poll()).toEqual(emptyActions())
  })
})
