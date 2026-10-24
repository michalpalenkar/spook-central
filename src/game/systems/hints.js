// In-world hints. A room lists hint zones as entities:
//   { type: 'hint', id, x, y, width, height }   (tiles)
// While the player stands inside one, the overlay shows that hint's text
// (worded for the player's input device; see ui/Menus.jsx).

export const SAVE_HINT = 'save'

/** The id of the first hint zone containing the point (room pixels), or null. */
export function hintAt(entities, x, y, tileSize) {
  const tx = x / tileSize
  const ty = y / tileSize
  const zone = entities.find(
    (e) => e.type === 'hint' && tx >= e.x && tx < e.x + e.width && ty >= e.y && ty < e.y + e.height,
  )
  return zone?.id ?? null
}

/**
 * Whether the player can rest at a fire pole: standing on the ground within
 * `reach` px of it horizontally, and level with its base.
 *
 * `pole` is { x, feetY } in px; `player` is { x, feetY, grounded }.
 */
export function canUsePole(pole, player, reach, tileSize) {
  return (
    player.grounded && Math.abs(player.x - pole.x) <= reach && Math.abs(player.feetY - pole.feetY) < tileSize / 2
  )
}
