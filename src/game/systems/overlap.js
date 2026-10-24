/** Whether a circle touches an axis-aligned rectangle { x, y, width, height }. */
export function circleIntersectsRect(cx, cy, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width))
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height))
  return (cx - nearestX) ** 2 + (cy - nearestY) ** 2 <= radius ** 2
}
