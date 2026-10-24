import { KEY_BINDINGS, readActions } from './keyBindings.js'

/** InputState source backed by the Phaser keyboard plugin. */
export class KeyboardInput {
  constructor(keyboard, bindings = KEY_BINDINGS) {
    this.bindings = bindings
    this.keys = new Map()
    // Keys pressed since the last poll, so a tap shorter than a frame still
    // registers as held for one frame.
    this.tapped = new Set()

    for (const names of Object.values(bindings)) {
      for (const name of names) {
        if (this.keys.has(name)) continue
        const key = keyboard.addKey(name)
        key.on('down', () => this.tapped.add(name))
        this.keys.set(name, key)
      }
    }
  }

  poll() {
    const actions = readActions(this.bindings, (name) => this.keys.get(name).isDown || this.tapped.has(name))
    this.tapped.clear()
    return actions
  }
}
