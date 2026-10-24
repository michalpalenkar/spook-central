/**
 * Paints hand-drawn pixel rows onto a canvas context. Each character is one
 * pixel; `.` is transparent and the rest are keys into `colors`.
 */
export function drawPixelRows(ctx, rows, colors, ox, oy) {
  rows.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      if (char === '.') return
      ctx.fillStyle = colors[char]
      ctx.fillRect(ox + x, oy + y, 1, 1)
    })
  })
}
