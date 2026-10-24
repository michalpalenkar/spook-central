/** '#rrggbb' → 0xrrggbb, for Phaser tints and Graphics colours. */
export function toColor(hex) {
  return parseInt(hex.slice(1), 16)
}
