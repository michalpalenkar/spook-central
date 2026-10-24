/** '#rrggbb' → 0xrrggbb, for Phaser tints and Graphics colours. */
export function toColor(hex) {
  return parseInt(hex.slice(1), 16)
}

/** '#rrggbb' + alpha → a CSS rgba() string for canvas gradients. */
export function rgba(hex, alpha = 1) {
  const n = toColor(hex)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}
