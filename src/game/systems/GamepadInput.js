import { ACTIONS, emptyActions } from './InputState.js'
import { readGamepad } from './gamepadBindings.js'

const browserGamepads = () => globalThis.navigator?.getGamepads?.() ?? []

/**
 * InputState source that reads every connected gamepad through the browser
 * Gamepad API. Pads are polled, so there is nothing to subscribe to.
 */
export class GamepadInput {
  constructor(getGamepads = browserGamepads) {
    this.getGamepads = getGamepads
  }

  poll() {
    const actions = emptyActions()
    for (const pad of this.getGamepads()) {
      if (!pad || !pad.connected) continue
      const held = readGamepad(pad)
      for (const action of ACTIONS) {
        if (held[action]) actions[action] = true
      }
    }
    return actions
  }
}
