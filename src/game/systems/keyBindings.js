// Phaser key names (Phaser.Input.Keyboard.KeyCodes) bound to each action.
export const KEY_BINDINGS = {
  left: ['A', 'LEFT'],
  right: ['D', 'RIGHT'],
  up: ['W', 'UP'],
  down: ['S', 'DOWN'],
  jump: ['SPACE', 'Z'],
  fire: ['J', 'X'],
  trap: ['K', 'C'],
  dash: ['L', 'SHIFT'],
  pause: ['ESC', 'TAB'],
}

/** Resolves bindings to an action map, given whether each key is down. */
export function readActions(bindings, isKeyDown) {
  return Object.fromEntries(
    Object.entries(bindings).map(([action, keys]) => [action, keys.some((key) => isKeyDown(key))]),
  )
}
