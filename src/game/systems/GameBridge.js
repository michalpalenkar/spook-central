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
 * boss fight, else null), screen ('loading', 'title', 'playing', 'paused'
 * or 'ending'), menu (systems/menuModel.js menuView, or null), settings
 * (systems/settings.js), ending (stats for the ending screen, or null) }.
 * Toasts and banners have separate slots so an area name never hides a
 * message.
 *
 * The other way, React sends commands to the game with `send` (menu clicks,
 * "pause now" when the device turns to portrait); the game listens with
 * `onCommand`.
 */
export class GameBridge {
  constructor(initial = {}) {
    this.state = {
      mapOpen: false,
      map: null,
      hint: null,
      toast: null,
      banner: null,
      area: null,
      boss: null,
      screen: 'loading',
      menu: null,
      settings: null,
      ending: null,
      ...initial,
    }
    this.listeners = new Set()
    this.commandListeners = new Set()
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

  /** Sends a command from the overlays to the game: { type, ... }. */
  send(command) {
    for (const listener of this.commandListeners) listener(command)
  }

  /** Listens for commands; returns a function that stops listening. */
  onCommand(listener) {
    this.commandListeners.add(listener)
    return () => this.commandListeners.delete(listener)
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
