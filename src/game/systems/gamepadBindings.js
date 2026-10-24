import { GAMEPAD } from '../constants.js'
import { emptyActions } from './InputState.js'

// Button indices of the W3C "standard" gamepad mapping.
export const STANDARD_BUTTONS = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  BACK: 8,
  START: 9,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
}

const ANALOG_BUTTONS = new Set(['LT', 'RT'])

export const GAMEPAD_BINDINGS = {
  left: ['DPAD_LEFT'],
  right: ['DPAD_RIGHT'],
  up: ['DPAD_UP'],
  down: ['DPAD_DOWN'],
  jump: ['A'],
  fire: ['X', 'RT'],
  trap: ['Y'],
  dash: ['B', 'RB'],
  pause: ['START'],
}

// Left stick axes: index and the sign that points toward each direction.
const STICK = {
  left: { axis: 0, sign: -1 },
  right: { axis: 0, sign: 1 },
  up: { axis: 1, sign: -1 },
  down: { axis: 1, sign: 1 },
}

function isButtonDown(pad, name, tuning) {
  const button = pad.buttons[STANDARD_BUTTONS[name]]
  if (!button) return false
  if (ANALOG_BUTTONS.has(name)) return button.value >= tuning.TRIGGER_THRESHOLD
  return button.pressed
}

/** Reads one Gamepad (or any { buttons, axes } shape) into an action map. */
export function readGamepad(pad, bindings = GAMEPAD_BINDINGS, tuning = GAMEPAD) {
  const actions = emptyActions()
  for (const [action, buttons] of Object.entries(bindings)) {
    actions[action] = buttons.some((name) => isButtonDown(pad, name, tuning))
  }
  for (const [direction, { axis, sign }] of Object.entries(STICK)) {
    const value = pad.axes[axis] ?? 0
    if (value * sign > tuning.STICK_DEADZONE) actions[direction] = true
  }
  return actions
}
