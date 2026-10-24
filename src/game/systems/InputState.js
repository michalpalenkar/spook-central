export const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'fire', 'trap', 'dash', 'pause']

export function emptyActions() {
  return Object.fromEntries(ACTIONS.map((action) => [action, false]))
}

/**
 * The one place game code reads input from. Each source (keyboard, and later
 * gamepad and touch) has a `poll()` that returns which actions it holds; an
 * action is down when any source holds it.
 */
export class InputState {
  constructor() {
    this.sources = []
    this.current = emptyActions()
    this.previous = emptyActions()
    // How many times update() has run: a frame number for "pressed this frame" checks.
    this.frame = 0
  }

  addSource(source) {
    this.sources.push(source)
  }

  /** Call once per frame before game logic reads input. */
  update() {
    const next = emptyActions()
    for (const source of this.sources) {
      const held = source.poll()
      for (const action of ACTIONS) {
        if (held[action]) next[action] = true
      }
    }
    this.previous = this.current
    this.current = next
    this.frame++
  }

  isDown(action) {
    return this.current[action]
  }

  justPressed(action) {
    return this.current[action] && !this.previous[action]
  }

  justReleased(action) {
    return !this.current[action] && this.previous[action]
  }

  /** -1 for left, 1 for right, 0 for neither or both. */
  get horizontal() {
    return (this.current.right ? 1 : 0) - (this.current.left ? 1 : 0)
  }
}
