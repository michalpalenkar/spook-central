// Text for in-world hints (ids come from room hint zones and systems/hints.js),
// worded for keyboard or touch. Gamepad players see the keyboard wording.
// A hint can also be { id, vars } for text built from values (the shop).
export const HINT_TEXT = {
  move: { keys: '← → or A D to run · Space to jump, hold for height', touch: 'D-pad to run · hold Jump for height' },
  climb: { keys: 'Jump up through the wooden planks', touch: 'Jump up through the wooden planks' },
  save: { keys: 'Press ↑ at the fire pole to rest and save', touch: 'Press ↑ at the fire pole to rest and save' },
  map: { keys: 'Tab or Esc opens the map', touch: 'The ❚❚ button opens the map' },
  combat: { keys: 'Hold J to wrangle a ghost with the proton stream', touch: 'Hold Fire to wrangle a ghost' },
  trap: { keys: 'Weaken a ghost, then press K to throw a trap under it', touch: 'Weaken a ghost, then tap Trap' },
  vault: { keys: 'The archive vault. Shhh… something old is sleeping.', touch: 'The archive vault. Shhh… something old is sleeping.' },
  spectral: { keys: 'The PKE Meter screams: this wall isn’t really there', touch: 'The PKE Meter screams: this wall isn’t really there' },
  weakFloor: { keys: 'The floor is rotten through · press ↓ to stomp it', touch: 'The floor is rotten through · press ↓ to stomp it' },
  slimer: { keys: 'Something green is eating the buffet…', touch: 'Something green is eating the buffet…' },
  barrier: { keys: 'Ectoplasm. An Ecto-Dash (L / Shift) would carry you through', touch: 'Ectoplasm. An Ecto-Dash would carry you through' },
  slime: {
    keys: 'Slimed walls · with Slime Boots, jump at them and hold toward the wall to cling',
    touch: 'Slimed walls · with Slime Boots, jump at them and hold toward the wall to cling',
  },
  shop: {
    keys: ({ item, price, have }) => `${item} · ${price} essence (you have ${have}) · press ↑ to buy`,
    touch: ({ item, price, have }) => `${item} · ${price} essence (you have ${have}) · press ↑ to buy`,
  },
  shopEmpty: { keys: 'The supply desk is sold out. Ray will be thrilled.', touch: 'The supply desk is sold out. Ray will be thrilled.' },
}

export const HINT_IDS = Object.keys(HINT_TEXT)

/** A hint's id, whether it is a plain id or { id, vars }. */
export function hintId(hint) {
  return typeof hint === 'string' ? hint : (hint?.id ?? null)
}

export function hintText(hint, touch) {
  const text = HINT_TEXT[hintId(hint)]
  if (!text) return null
  const wording = touch ? text.touch : text.keys
  return typeof wording === 'function' ? wording(hint.vars ?? {}) : wording
}
