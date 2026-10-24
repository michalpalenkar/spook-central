/**
 * A tiny store the game writes to and React reads from (with
 * useSyncExternalStore), for the HTML overlays: the area map, in-world hints
 * and toasts. Like TouchInput, App creates one and passes it to the game
 * through the registry. State is replaced, never mutated, so React sees
 * every change.
 *
 * State: { mapOpen, map (from buildMapView), hint (id, { id, vars } or
 * null), toast ({ id, text } or null), banner (area name, same shape), area
 * (current area id), boss ({ name, health 0..1, phase, phases } during a
 * boss fight, else null) }. Toasts and banners have separate slots so an
 * area name never hides a message.
 */
export class GameBridge {
  constructor() {
    this.state = { mapOpen: false, map: null, hint: null, toast: null, banner: null, area: null, boss: null }
    this.listeners = new Set()
    this.messageCount = 0
    this.subscribe = this.subscribe.bind(this)
    this.getState = this.getState.bind(this)
  }

  getState() {
    return this.state
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** Merges `partial` into the state; does nothing if no value changes. */
  update(partial) {
    const changed = Object.entries(partial).some(([key, value]) => this.state[key] !== value)
    if (!changed) return
    this.state = { ...this.state, ...partial }
    for (const listener of this.listeners) listener()
  }

  /** Shows a short message; each call gets a new id so repeats show again. */
  toast(text) {
    this.messageCount++
    this.update({ toast: { id: this.messageCount, text } })
  }

  /** Shows the name of the area the player just walked into. */
  announceArea(area, name) {
    this.messageCount++
    this.update({ area, banner: { id: this.messageCount, text: name } })
  }
}
