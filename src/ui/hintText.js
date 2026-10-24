// Text for in-world hints (ids come from room hint zones and systems/hints.js),
// worded for keyboard or touch. Gamepad players see the keyboard wording.
export const HINT_TEXT = {
  move: { keys: '← → or A D to run · Space to jump, hold for height', touch: 'D-pad to run · hold Jump for height' },
  climb: { keys: 'Jump up through the wooden planks', touch: 'Jump up through the wooden planks' },
  save: { keys: 'Press ↑ at the fire pole to rest and save', touch: 'Press ↑ at the fire pole to rest and save' },
  map: { keys: 'Tab or Esc opens the map', touch: 'The ❚❚ button opens the map' },
  combat: { keys: 'Hold J to wrangle a ghost with the proton stream', touch: 'Hold Fire to wrangle a ghost' },
  trap: { keys: 'Weaken a ghost, then press K to throw a trap under it', touch: 'Weaken a ghost, then tap Trap' },
  vault: { keys: 'The archive vault. Shhh… something old is sleeping.', touch: 'The archive vault. Shhh… something old is sleeping.' },
}

export const HINT_IDS = Object.keys(HINT_TEXT)

export function hintText(id, touch) {
  const text = HINT_TEXT[id]
  if (!text) return null
  return touch ? text.touch : text.keys
}
