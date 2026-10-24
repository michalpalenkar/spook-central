import { emptyActions } from './InputState.js'

/**
 * InputState source fed by the on-screen touch controls. The React overlay
 * reports, per pointer, which actions that finger holds; poll() returns the
 * union across all fingers.
 */
export class TouchInput {
  constructor() {
    this.pointers = new Map()
    // Actions pressed since the last poll, so a tap shorter than a frame still
    // registers as held for one frame.
    this.tapped = new Set()
  }

  setPointer(id, actions) {
    const before = this.pointers.get(id) ?? []
    for (const action of actions) {
      if (!before.includes(action)) this.tapped.add(action)
    }
    this.pointers.set(id, actions)
  }

  releasePointer(id) {
    this.pointers.delete(id)
  }

  releaseAll() {
    this.pointers.clear()
  }

  heldActions() {
    const held = new Set()
    for (const actions of this.pointers.values()) {
      for (const action of actions) held.add(action)
    }
    return held
  }

  poll() {
    const actions = emptyActions()
    for (const action of this.heldActions()) actions[action] = true
    for (const action of this.tapped) actions[action] = true
    this.tapped.clear()
    return actions
  }
}
