import { rgba } from './color.js'

/** Bounding box of a draw command (see art/sceneryShapes.js). */
export function commandBounds(cmd) {
  switch (cmd.op) {
    case 'rect':
    case 'vgrad':
      return { left: cmd.x, right: cmd.x + cmd.w, top: cmd.y, bottom: cmd.y + cmd.h }
    case 'ellipse':
    case 'ring': {
      const pad = (cmd.width ?? 0) / 2
      return { left: cmd.x - cmd.rx - pad, right: cmd.x + cmd.rx + pad, top: cmd.y - cmd.ry - pad, bottom: cmd.y + cmd.ry + pad }
    }
    case 'glow':
      return { left: cmd.x - cmd.r, right: cmd.x + cmd.r, top: cmd.y - cmd.r, bottom: cmd.y + cmd.r }
    default: {
      const xs = cmd.points.filter((_, i) => i % 2 === 0)
      const ys = cmd.points.filter((_, i) => i % 2 === 1)
      const pad = (cmd.width ?? 0) / 2
      return { left: Math.min(...xs) - pad, right: Math.max(...xs) + pad, top: Math.min(...ys) - pad, bottom: Math.max(...ys) + pad }
    }
  }
}

/**
 * Offsets at which to repeat a command so a strip `width` × `height` tiles
 * seamlessly: horizontally always, vertically when `wrapY`.
 */
export function wrapOffsets(bounds, width, height, wrapY) {
  const xs = [0]
  if (bounds.left < 0) xs.push(width)
  if (bounds.right > width) xs.push(-width)
  const ys = [0]
  if (wrapY && bounds.top < 0) ys.push(height)
  if (wrapY && bounds.bottom > height) ys.push(-height)
  return xs.flatMap((dx) => ys.map((dy) => ({ dx, dy })))
}

function paintOne(ctx, cmd, dx, dy) {
  ctx.globalAlpha = cmd.alpha ?? 1
  switch (cmd.op) {
    case 'rect':
      ctx.fillStyle = cmd.color
      ctx.fillRect(Math.round(cmd.x + dx), Math.round(cmd.y + dy), Math.round(cmd.w), Math.round(cmd.h))
      return
    case 'ellipse':
      ctx.fillStyle = cmd.color
      ctx.beginPath()
      ctx.ellipse(cmd.x + dx, cmd.y + dy, cmd.rx, cmd.ry, 0, 0, Math.PI * 2)
      ctx.fill()
      return
    case 'ring':
      ctx.strokeStyle = cmd.color
      ctx.lineWidth = cmd.width
      ctx.beginPath()
      ctx.ellipse(cmd.x + dx, cmd.y + dy, cmd.rx, cmd.ry, 0, 0, Math.PI * 2)
      ctx.stroke()
      return
    case 'poly':
    case 'line': {
      const p = cmd.points
      ctx.beginPath()
      ctx.moveTo(p[0] + dx, p[1] + dy)
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] + dx, p[i + 1] + dy)
      if (cmd.op === 'poly') {
        ctx.fillStyle = cmd.color
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.strokeStyle = cmd.color
        ctx.lineWidth = cmd.width
        ctx.stroke()
      }
      return
    }
    case 'vgrad': {
      ctx.globalAlpha = 1
      const gradient = ctx.createLinearGradient(0, cmd.y + dy, 0, cmd.y + dy + cmd.h)
      gradient.addColorStop(0, rgba(cmd.from, cmd.fromAlpha))
      gradient.addColorStop(1, rgba(cmd.to, cmd.toAlpha))
      ctx.fillStyle = gradient
      ctx.fillRect(Math.round(cmd.x + dx), Math.round(cmd.y + dy), Math.round(cmd.w), Math.round(cmd.h))
      return
    }
    case 'glow': {
      const gradient = ctx.createRadialGradient(cmd.x + dx, cmd.y + dy, 0, cmd.x + dx, cmd.y + dy, cmd.r)
      gradient.addColorStop(0, rgba(cmd.color, 1))
      gradient.addColorStop(1, rgba(cmd.color, 0))
      ctx.fillStyle = gradient
      ctx.fillRect(cmd.x + dx - cmd.r, cmd.y + dy - cmd.r, cmd.r * 2, cmd.r * 2)
      return
    }
    default:
      throw new Error(`Unknown draw command "${cmd.op}"`)
  }
}

/** Paints draw commands onto a 2D context, wrapping them around the strip's edges. */
export function paintCommands(ctx, commands, { width, height, wrapY = false }) {
  ctx.save()
  for (const cmd of commands) {
    for (const { dx, dy } of wrapOffsets(commandBounds(cmd), width, height, wrapY)) paintOne(ctx, cmd, dx, dy)
  }
  ctx.restore()
}
