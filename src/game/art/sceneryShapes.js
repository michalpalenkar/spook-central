import { intOf, pickOf, rangeOf } from './rng.js'

// Procedural scenery as plain draw commands, so it can be tested without a
// canvas. art/paintCommands.js turns them into pixels. Commands:
//   { op: 'rect', x, y, w, h, color, alpha }
//   { op: 'poly', points: [x0, y0, x1, y1, …], color, alpha }
//   { op: 'ellipse', x, y, rx, ry, color, alpha }
//   { op: 'ring', x, y, rx, ry, color, alpha, width }
//   { op: 'line', points, color, alpha, width }
//   { op: 'vgrad', x, y, w, h, from, to, fromAlpha, toAlpha }
//   { op: 'glow', x, y, r, color, alpha }
// Strips repeat horizontally (and interiors vertically), so shapes may run
// past an edge; the painter wraps them around.
//
// Depth reads through value: far layers are paler and low-contrast (fog),
// mid layers darker silhouettes with thin rims, the foreground near-black.

const rect = (x, y, w, h, color, alpha = 1) => ({ op: 'rect', x, y, w, h, color, alpha })
const poly = (points, color, alpha = 1) => ({ op: 'poly', points, color, alpha })
const ellipse = (x, y, rx, ry, color, alpha = 1) => ({ op: 'ellipse', x, y, rx, ry, color, alpha })
const ring = (x, y, rx, ry, color, alpha = 1, width = 1) => ({ op: 'ring', x, y, rx, ry, color, alpha, width })
const line = (points, color, alpha = 1, width = 1) => ({ op: 'line', points, color, alpha, width })
const vgrad = (x, y, w, h, from, to, fromAlpha, toAlpha) => ({ op: 'vgrad', x, y, w, h, from, to, fromAlpha, toAlpha })
const glow = (x, y, r, color, alpha) => ({ op: 'glow', x, y, r, color, alpha })

/** A dark block with a thin pale rim on its top and left edges. */
function block(x, y, w, h, fill, rim, rimAlpha = 0.5) {
  return [rect(x, y, w, h, fill), rect(x, y, w, 1, rim, rimAlpha), rect(x, y, 1, h, rim, rimAlpha * 0.6)]
}

/** Places props left to right with random gaps; `place(x, rng)` returns [commands, width]. */
function strew(width, rng, gap, place) {
  const out = []
  let x = rangeOf(rng, 0, gap[1])
  while (x < width - gap[0] / 2) {
    const [commands, w] = place(Math.round(x), rng)
    out.push(...commands)
    x += w + rangeOf(rng, gap[0], gap[1])
  }
  return out
}

// ---------------------------------------------------------------- backdrops

/** The night sky behind an outdoor room: gradient, stars, moon, clouds. */
export function paintSky({ width, height, palette, rng }) {
  const sky = palette.sky
  const out = [vgrad(0, 0, width, height, sky.top, sky.bottom, 1, 1)]
  for (let i = 0; i < 70; i++) {
    const x = intOf(rng, 0, width - 1)
    const y = intOf(rng, 0, Math.round(height * 0.6))
    out.push(rect(x, y, 1, 1, sky.star, rangeOf(rng, 0.25, 0.9)))
  }
  const moonX = Math.round(width * 0.78)
  const moonY = Math.round(height * 0.2)
  out.push(glow(moonX, moonY, 70, sky.moonGlow, 0.28), ellipse(moonX, moonY, 13, 13, sky.moon, 0.95))
  out.push(ellipse(moonX + 4, moonY - 3, 3, 2, sky.moonGlow, 0.35), ellipse(moonX - 5, moonY + 4, 2, 2, sky.moonGlow, 0.3))
  // Cloud banks: chains of overlapping ellipses with a pale rim on top.
  for (let band = 0; band < 4; band++) {
    const y = Math.round(height * (0.18 + band * 0.17))
    let x = rangeOf(rng, -40, 0)
    while (x < width + 40) {
      const rx = rangeOf(rng, 18, 46)
      const ry = rangeOf(rng, 4, 9)
      out.push(ellipse(x, y - 1, rx, ry, sky.cloudLight, 0.35), ellipse(x, y + 1, rx, ry, sky.cloud, 0.85))
      x += rx * rangeOf(rng, 1.1, 2.4)
    }
  }
  return out
}

// ---------------------------------------------------------------- far layers

/** Firehouse: brick bays with tall arched windows letting in night light. */
function arches({ width, height, palette: c }) {
  const out = [rect(0, 0, width, height, c.far)]
  for (let y = 4; y < height; y += 8) out.push(rect(0, y, width, 1, c.mid, 0.18))
  const bay = 128
  for (let bx = 0; bx < width; bx += bay) {
    out.push(...block(bx, 0, 14, height, c.farLight, c.window, 0.25))
    const cx = bx + bay / 2
    const top = 70
    out.push(ellipse(cx, top, 20, 20, c.window, 0.12), rect(cx - 20, top, 40, 100, c.window, 0.12))
    out.push(rect(cx - 1, top - 20, 2, 120, c.far), rect(cx - 20, top + 30, 40, 2, c.far), rect(cx - 20, top + 62, 40, 2, c.far))
    out.push(rect(cx - 24, top + 100, 48, 4, c.farLight), vgrad(cx - 30, top + 104, 60, 80, c.window, c.window, 0.08, 0))
  }
  out.push(rect(0, height - 14, width, 3, c.farLight), rect(0, height - 11, width, 11, c.mid, 0.5))
  return out
}

/** Library: pointed gothic windows in cold light between stone columns, a gallery rail. */
function gothic({ width, height, palette: c }) {
  const out = [rect(0, 0, width, height, c.far)]
  for (let y = 6; y < height; y += 12) out.push(rect(0, y, width, 1, c.mid, 0.15))
  const bay = 128
  for (let bx = 0; bx < width; bx += bay) {
    out.push(...block(bx, 0, 16, height, c.farLight, c.window, 0.2))
    out.push(rect(bx - 3, 40, 22, 5, c.farLight), rect(bx - 3, 220, 22, 4, c.farLight))
    for (const dx of [40, 72]) {
      const x = bx + dx
      out.push(poly([x, 70, x + 8, 44, x + 16, 70, x + 16, 190, x, 190], c.window, 0.15))
      out.push(rect(x + 7, 50, 2, 140, c.far), rect(x, 110, 16, 1, c.far), rect(x, 150, 16, 1, c.far))
      out.push(vgrad(x - 10, 190, 36, 50, c.window, c.window, 0.07, 0))
    }
    out.push(ellipse(bx + 64, 30, 9, 9, c.window, 0.12), ring(bx + 64, 30, 9, 9, c.far, 1, 2))
  }
  out.push(rect(0, 226, width, 2, c.farLight))
  for (let x = 0; x < width; x += 6) out.push(rect(x, 228, 2, 18, c.farLight, 0.7))
  out.push(rect(0, 246, width, 3, c.farLight))
  return out
}

/** Hotel: faded crimson damask, gilt-trimmed wainscot, pilasters and portraits. */
function wallpaper({ width, height, palette: c, rng }) {
  const out = [rect(0, 0, width, height, c.far)]
  for (let x = 0; x < width; x += 16) out.push(rect(x, 0, 2, 180, c.farLight, 0.45))
  for (let y = 12, row = 0; y < 176; y += 24, row++) {
    for (let x = 8; x < width; x += 16) {
      const ox = row % 2 ? 0 : 8
      out.push(poly([x + ox, y - 4, x + ox + 3, y, x + ox, y + 4, x + ox - 3, y], c.farLight, 0.5))
    }
  }
  out.push(rect(0, 178, width, 2, c.midLight, 0.55), rect(0, 180, width, height - 180, c.farLight, 0.55))
  out.push(rect(0, 184, width, 1, c.midLight, 0.35))
  for (let x = 6; x < width; x += 32) out.push(ring(x + 13, 220, 11, 24, c.midLight, 0.18))
  for (let bx = 0; bx < width; bx += 128) {
    out.push(...block(bx, 0, 12, 178, c.farLight, c.midLight, 0.35), rect(bx - 2, 0, 16, 6, c.midLight, 0.3))
  }
  for (let px = 40; px < width; px += 256) {
    const x = px + intOf(rng, 0, 30)
    out.push(rect(x, 60, 40, 50, c.midLight, 0.4), rect(x + 3, 63, 34, 44, c.mid, 0.85))
    out.push(ellipse(x + 20, 80, 7, 9, c.farLight), rect(x + 11, 90, 18, 17, c.farLight))
  }
  return out
}

/** Skyline seen from the street or a roof: two rows of towers, water tanks, lit windows. */
function skyline({ width, height, palette: c, rng }) {
  const s = c.sky
  const out = []
  const row = (tone, rim, minH, maxH, lit) =>
    strew(width, rng, [-4, 6], (x) => {
      const w = intOf(rng, 14, 44)
      const h = intOf(rng, minH, maxH)
      const y = height - h
      const parts = block(x, y, w, h, tone, rim, 0.45)
      const top = pickOf(rng, ['flat', 'flat', 'setback', 'spire', 'tank'])
      if (top === 'setback') parts.push(...block(x + 4, y - 10, w - 8, 10, tone, rim, 0.45))
      if (top === 'spire') parts.push(poly([x + w / 2 - 4, y, x + w / 2, y - 18, x + w / 2 + 4, y], tone))
      if (top === 'tank') {
        parts.push(rect(x + 4, y - 4, 1, 4, tone), rect(x + 10, y - 4, 1, 4, tone), rect(x + 3, y - 12, 9, 8, tone))
        parts.push(poly([x + 3, y - 12, x + 7.5, y - 16, x + 12, y - 12], tone))
      }
      for (let wy = y + 4; wy < height - 3; wy += 4) {
        for (let wx = x + 3; wx < x + w - 2; wx += 3) {
          if (rng() < lit) parts.push(rect(wx, wy, 1, 2, s.skylineWindow, rangeOf(rng, 0.4, 0.9)))
        }
      }
      return [parts, w]
    })
  out.push(...row(s.skylineBack, s.skylineBack, 50, height - 10, 0.03))
  out.push(...row(s.skyline, s.skylineLight, 24, height - 40, 0.07))
  out.push(vgrad(0, height - 30, width, 30, s.bottom, s.bottom, 0, 0.55))
  return out
}

// ---------------------------------------------------------------- mid layers

/** Firehouse: lockers, ladders, coiled hoses and a helmet rack on the floor of each storey. */
function lockers({ width, height, palette: c, rng }) {
  const out = [rect(0, 18, width, 3, c.mid), rect(0, 21, width, 1, c.midLight, 0.4)]
  for (let x = 20; x < width; x += 64) out.push(rect(x, 21, 2, 6, c.mid))
  out.push(
    ...strew(width, rng, [26, 70], (x) => {
      const kind = pickOf(rng, ['lockers', 'ladder', 'hose', 'helmets'])
      if (kind === 'lockers') {
        const n = intOf(rng, 2, 4)
        const parts = []
        for (let i = 0; i < n; i++) {
          parts.push(...block(x + i * 15, height - 64, 14, 64, c.mid, c.midLight))
          for (let v = 0; v < 3; v++) parts.push(rect(x + i * 15 + 3, height - 58 + v * 3, 8, 1, c.midLight, 0.3))
        }
        return [parts, n * 15]
      }
      if (kind === 'ladder') {
        const h = intOf(rng, 90, 140)
        const parts = [rect(x, height - h, 2, h, c.mid), rect(x + 14, height - h, 2, h, c.mid)]
        for (let y = height - h + 6; y < height; y += 10) parts.push(rect(x, y, 16, 2, c.mid))
        parts.push(rect(x, height - h, 1, h, c.midLight, 0.3))
        return [parts, 16]
      }
      if (kind === 'hose') {
        const y = height - intOf(rng, 90, 130)
        return [[rect(x + 11, y - 18, 2, 8, c.mid), ring(x + 12, y, 11, 11, c.mid, 1, 3), ring(x + 12, y, 7, 7, c.mid, 1, 2), ring(x + 12, y - 1, 11, 11, c.midLight, 0.25)], 24]
      }
      const parts = [rect(x, height - 110, 40, 2, c.mid)]
      for (let i = 0; i < 3; i++) parts.push(ellipse(x + 7 + i * 13, height - 112, 6, 5, c.mid), rect(x + 1 + i * 13, height - 112, 13, 2, c.mid))
      parts.push(...block(x - 4, height - 40, 48, 40, c.mid, c.midLight))
      return [parts, 44]
    }),
  )
  return out
}

/** Library: bookcases of muted spines, with gaps where the far wall shows. */
function shelves({ width, height, palette: c, rng }) {
  return strew(width, rng, [30, 80], (x) => {
    const w = intOf(rng, 56, 90)
    const h = intOf(rng, 130, height - 20)
    const top = height - h
    const parts = block(x, top, w, h, c.mid, c.midLight)
    parts.push(rect(x - 3, top, w + 6, 4, c.mid), rect(x - 3, top, w + 6, 1, c.midLight, 0.5))
    for (let sy = top + 8; sy < height - 6; sy += 26) {
      let bx = x + 3
      while (bx < x + w - 4) {
        const bw = intOf(rng, 2, 5)
        const bh = intOf(rng, 13, 21)
        if (rng() < 0.08) {
          bx += bw + 3
          continue
        }
        parts.push(rect(bx, sy + 22 - bh, bw, bh, pickOf(rng, c.spine), 0.3))
        if (bw > 2) parts.push(rect(bx + 1, sy + 22 - bh + 3, bw - 2, 1, c.midLight, 0.2))
        bx += bw + (rng() < 0.2 ? 1 : 0)
      }
      parts.push(rect(x + 2, sy + 22, w - 4, 3, c.mid), rect(x + 2, sy + 22, w - 4, 1, c.midLight, 0.35))
    }
    if (rng() < 0.4) parts.push(line([x + w - 10, top + 10, x + w + 12, height], c.midLight, 0.45, 2))
    return [parts, w]
  })
}

/** Hotel: fluted columns, drapes and chandeliers glowing gold. */
function chandeliers({ width, height, palette: c, rng }) {
  const out = []
  for (let x = 0; x < width; x += 170) {
    out.push(...block(x, 0, 18, height, c.mid, c.midLight, 0.35))
    for (let f = 4; f < 16; f += 4) out.push(rect(x + f, 14, 1, height - 28, c.midLight, 0.15))
    out.push(rect(x - 4, 6, 26, 8, c.mid), rect(x - 4, 6, 26, 1, c.midLight, 0.5), rect(x - 4, height - 12, 26, 12, c.mid))
    out.push(poly([x + 18, 0, x + 60, 0, x + 34, 40, x + 22, 150, x + 18, 150], c.mid, 0.9))
    out.push(line([x + 30, 2, x + 24, 120], c.midLight, 0.2))
  }
  for (let x = 95; x < width; x += 170) {
    const cx = x + intOf(rng, -10, 10)
    const drop = intOf(rng, 36, 60)
    out.push(rect(cx, 0, 1, drop, c.midLight, 0.6), glow(cx, drop + 10, 34, c.lamp, 0.22))
    out.push(ellipse(cx, drop + 8, 14, 4, c.midLight, 0.75), ellipse(cx, drop + 14, 9, 3, c.midLight, 0.65), poly([cx - 3, drop + 16, cx, drop + 24, cx + 3, drop + 16], c.midLight, 0.7))
    for (let i = -2; i <= 2; i++) out.push(rect(cx + i * 6, drop + 2, 1, 4, c.lamp, 0.9))
  }
  return out
}

/** Outside the library: lamp posts, trees, an iron fence and a stone lion. */
function street({ width, height, palette: c, rng }) {
  const out = strew(width, rng, [30, 70], (x) => {
    const kind = pickOf(rng, ['lamp', 'tree', 'tree', 'lion'])
    if (kind === 'lamp') {
      const h = intOf(rng, 70, 90)
      const y = height - h
      return [[rect(x + 3, y, 2, h, c.mid), rect(x, y - 2, 8, 3, c.mid), rect(x + 1, y + 1, 6, 6, c.lamp, 0.65), glow(x + 4, y + 4, 26, c.lamp, 0.3), rect(x + 1, height - 6, 6, 6, c.mid)], 8]
    }
    if (kind === 'tree') {
      const h = intOf(rng, 60, 100)
      const parts = [rect(x + 14, height - h + 20, 4, h - 20, c.mid)]
      for (let i = 0; i < 6; i++) {
        const ex = x + 16 + rangeOf(rng, -14, 14)
        const ey = height - h + 20 + rangeOf(rng, -16, 10)
        parts.push(ellipse(ex, ey - 1, rangeOf(rng, 9, 15), rangeOf(rng, 7, 11), c.midLight, 0.25), ellipse(ex, ey + 1, rangeOf(rng, 9, 15), rangeOf(rng, 7, 11), c.mid))
      }
      return [parts, 32]
    }
    const y = height - 34
    return [[...block(x, y + 12, 40, 22, c.mid, c.midLight), poly([x + 4, y + 12, x + 8, y + 2, x + 18, y, x + 24, y + 4, x + 34, y + 6, x + 38, y + 12], c.mid), rect(x + 6, y + 1, 8, 1, c.midLight, 0.5), ellipse(x + 11, y + 3, 6, 6, c.mid)], 40]
  })
  out.push(rect(0, height - 16, width, 2, c.mid), rect(0, height - 4, width, 4, c.mid))
  for (let x = 0; x < width; x += 5) out.push(rect(x, height - 19, 1, 19, c.mid), rect(x, height - 20, 1, 1, c.midLight, 0.6))
  return out
}

/** Spook Central's roof: stepped temple towers, columns, spires and antenna masts. */
function temple({ width, height, palette: c, rng }) {
  return strew(width, rng, [10, 40], (x) => {
    const kind = pickOf(rng, ['ziggurat', 'ziggurat', 'columns', 'mast'])
    if (kind === 'ziggurat') {
      const tiers = intOf(rng, 3, 5)
      const w = intOf(rng, 60, 100)
      const parts = []
      let y = height
      for (let i = 0; i < tiers; i++) {
        const tw = w - i * (w / (tiers + 1))
        const th = intOf(rng, 14, 24)
        y -= th
        parts.push(...block(x + (w - tw) / 2, y, tw, th, c.mid, c.midLight, 0.5))
      }
      parts.push(poly([x + w / 2 - 3, y, x + w / 2, y - 22, x + w / 2 + 3, y], c.mid), rect(x + w / 2, y - 22, 1, 6, c.midLight, 0.6))
      return [parts, w]
    }
    if (kind === 'columns') {
      const parts = [rect(x - 2, height - 84, 40, 6, c.mid), rect(x - 2, height - 84, 40, 1, c.midLight, 0.5)]
      for (let i = 0; i < 4; i++) parts.push(...block(x + i * 10, height - 78, 6, 78, c.mid, c.midLight, 0.4))
      return [parts, 36]
    }
    const h = intOf(rng, 90, 130)
    const parts = [rect(x + 4, height - h, 2, h, c.mid), line([x + 5, height - h + 20, x - 6, height], c.mid), line([x + 5, height - h + 20, x + 16, height], c.mid)]
    for (let y = height - h + 10; y < height; y += 14) parts.push(rect(x + 1, y, 8, 1, c.mid))
    parts.push(rect(x + 4, height - h - 2, 2, 2, c.lamp, 0.9), glow(x + 5, height - h - 1, 8, c.lamp, 0.35))
    return [parts, 10]
  })
}

// ---------------------------------------------------------------- foreground

// Near-black shapes in front of the room, kept low and sparse so the player
// stays readable. `rim` traces the top edges.
function foreProps(width, height, c, rng, kinds) {
  return strew(width, rng, [110, 220], (x) => {
    const kind = pickOf(rng, Object.keys(kinds))
    return kinds[kind](x, height, c, rng)
  })
}

const rim = (x, y, w, c) => rect(x, y, w, 1, c.foreRim, 0.45)

function garage({ width, height, palette: c, rng }) {
  return foreProps(width, height, c, rng, {
    tires: (x, h) => {
      const parts = []
      for (let i = 0; i < 3; i++) parts.push(ellipse(x + 16, h - 6 - i * 9, 16, 6, c.fore), ring(x + 16, h - 7 - i * 9, 15, 5, c.foreRim, 0.25))
      return [parts, 32]
    },
    toolbox: (x, h) => [[rect(x, h - 26, 44, 26, c.fore), rim(x, h - 26, 44, c), rect(x + 16, h - 31, 12, 2, c.fore), rect(x + 15, h - 31, 1, 5, c.fore), rect(x + 28, h - 31, 1, 5, c.fore)], 44],
    cone: (x, h) => [[poly([x, h, x + 8, h - 30, x + 12, h - 30, x + 20, h], c.fore), rect(x - 3, h - 3, 26, 3, c.fore), rim(x + 8, h - 30, 4, c)], 26],
  })
}

function bookPiles({ width, height, palette: c, rng }) {
  return foreProps(width, height, c, rng, {
    pile: (x, h, cc, r) => {
      const parts = []
      let y = h
      for (let i = 0; i < intOf(r, 4, 8); i++) {
        const bw = intOf(r, 18, 30)
        const bh = intOf(r, 4, 7)
        const bx = x + intOf(r, -4, 4)
        y -= bh
        parts.push(rect(bx, y, bw, bh, cc.fore), rim(bx, y, bw, cc))
      }
      return [parts, 34]
    },
    globe: (x, h) => [[ellipse(x + 14, h - 30, 13, 13, c.fore), ring(x + 14, h - 30, 15, 15, c.foreRim, 0.3), rect(x + 13, h - 16, 3, 12, c.fore), poly([x + 2, h, x + 14, h - 6, x + 26, h], c.fore)], 28],
    lectern: (x, h) => [[poly([x, h - 44, x + 30, h - 52, x + 30, h - 46, x + 4, h - 38], c.fore), rect(x + 12, h - 44, 6, 40, c.fore), rect(x + 4, h - 4, 22, 4, c.fore), line([x, h - 44, x + 30, h - 52], c.foreRim, 0.4)], 30],
  })
}

function lounge({ width, height, palette: c, rng }) {
  return foreProps(width, height, c, rng, {
    armchair: (x, h) => [[ellipse(x + 18, h - 34, 18, 14, c.fore), rect(x, h - 26, 36, 20, c.fore), rect(x - 4, h - 30, 8, 24, c.fore), rect(x + 32, h - 30, 8, 24, c.fore), rect(x + 2, h - 6, 3, 6, c.fore), rect(x + 31, h - 6, 3, 6, c.fore), ring(x + 18, h - 35, 17, 13, c.foreRim, 0.25)], 40],
    palm: (x, h, cc, r) => {
      const parts = [poly([x + 4, h - 18, x + 24, h - 18, x + 20, h, x + 8, h], cc.fore), rim(x + 4, h - 18, 20, cc)]
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.45
        const len = rangeOf(r, 22, 34)
        parts.push(line([x + 14, h - 18, x + 14 + Math.cos(a) * len, h - 18 + Math.sin(a) * len * 0.8 + 6], cc.fore, 1, 3))
      }
      return [parts, 28]
    },
    cart: (x, h) => [[rect(x, h - 4, 46, 2, c.fore), rect(x + 2, h - 48, 2, 46, c.fore), rect(x + 42, h - 48, 2, 46, c.fore), ring(x + 23, h - 48, 21, 8, c.fore, 1, 2), rect(x + 6, h - 24, 18, 20, c.fore), rect(x + 26, h - 18, 14, 14, c.fore), rim(x + 6, h - 24, 18, c), ellipse(x + 6, h, 3, 3, c.fore), ellipse(x + 40, h, 3, 3, c.fore)], 46],
  })
}

function park({ width, height, palette: c, rng }) {
  return foreProps(width, height, c, rng, {
    hedge: (x, h, cc, r) => {
      const parts = []
      for (let i = 0; i < 5; i++) parts.push(ellipse(x + 8 + i * 9, h - rangeOf(r, 10, 16), 10, 12, cc.fore))
      parts.push(rect(x, h - 10, 54, 10, cc.fore))
      return [parts, 54]
    },
    hydrant: (x, h) => [[rect(x + 2, h - 18, 10, 18, c.fore), ellipse(x + 7, h - 19, 6, 4, c.fore), rect(x - 1, h - 13, 16, 4, c.fore), rim(x + 2, h - 22, 10, c)], 14],
    bench: (x, h) => [[rect(x, h - 14, 44, 3, c.fore), rect(x, h - 26, 44, 2, c.fore), rect(x, h - 20, 44, 2, c.fore), rect(x + 3, h - 14, 2, 14, c.fore), rect(x + 39, h - 14, 2, 14, c.fore), rim(x, h - 26, 44, c)], 44],
  })
}

function parapet({ width, height, palette: c, rng }) {
  return foreProps(width, height, c, rng, {
    wall: (x, h, cc, r) => {
      const w = intOf(r, 60, 100)
      const parts = [rect(x, h - 18, w, 18, cc.fore), rim(x, h - 18, w, cc)]
      for (let mx = x; mx < x + w - 6; mx += 12) parts.push(rect(mx, h - 24, 7, 6, cc.fore), rim(mx, h - 24, 7, cc))
      return [parts, w]
    },
    gargoyle: (x, h) => [[rect(x, h - 22, 30, 22, c.fore), poly([x + 4, h - 22, x + 10, h - 40, x + 26, h - 42, x + 36, h - 34, x + 26, h - 30, x + 24, h - 22], c.fore), poly([x + 10, h - 40, x + 12, h - 48, x + 16, h - 41], c.fore), rect(x + 27, h - 37, 2, 1, c.foreRim, 0.8)], 36],
    chimney: (x, h) => [[rect(x, h - 40, 18, 40, c.fore), rect(x - 2, h - 44, 22, 4, c.fore), rim(x - 2, h - 44, 22, c), rect(x + 6, h - 50, 6, 6, c.fore)], 20],
  })
}

/** Hanging shapes along the top of the screen. */
function hangers(width, height, c, rng, make) {
  return strew(width, rng, [120, 240], (x) => make(x, height, c, rng))
}

function hooks({ width, height, palette: c, rng }) {
  return hangers(width, height, c, rng, (x, _h, cc, r) => {
    const drop = intOf(r, 18, 40)
    const parts = []
    for (let y = 0; y < drop; y += 4) parts.push(ring(x, y + 2, 1.5, 2, cc.fore, 1, 1))
    if (r() < 0.5) parts.push(ring(x, drop + 12, 12, 10, cc.fore, 1, 3), ring(x, drop + 12, 7, 6, cc.fore, 1, 2))
    else parts.push(line([x, drop, x, drop + 6, x + 5, drop + 9, x + 8, drop + 5], cc.fore, 1, 2))
    return [parts, 24]
  })
}

function cobwebs({ width, height, palette: c, rng }) {
  return hangers(width, height, c, rng, (x, _h, cc, r) => {
    const parts = []
    const span = intOf(r, 30, 50)
    for (let i = 0; i <= 4; i++) parts.push(line([x + span / 2, 0, x + (span * i) / 4, 18 + Math.sin(i) * 6], cc.foreRim, 0.25))
    for (let k = 1; k <= 3; k++) {
      const pts = []
      for (let i = 0; i <= 4; i++) pts.push(x + span / 2 + ((span * i) / 4 - span / 2) * (k / 3), ((18 + Math.sin(i) * 6) * k) / 3)
      parts.push(line(pts, cc.foreRim, 0.2))
    }
    const thread = intOf(r, 20, 44)
    parts.push(line([x + span, 0, x + span, thread], cc.foreRim, 0.3), ellipse(x + span, thread + 2, 2, 2, cc.fore))
    return [parts, span]
  })
}

function valance({ width, palette: c }) {
  const out = [rect(0, 0, width, 6, c.fore), rect(0, 6, width, 1, c.foreRim, 0.4)]
  for (let x = 0; x < width; x += 40) {
    out.push(poly([x, 6, x + 10, 18, x + 20, 21, x + 30, 18, x + 40, 6], c.fore))
    out.push(line([x + 4, 10, x + 20, 18, x + 36, 10], c.foreRim, 0.3))
    out.push(rect(x, 6, 1, 18, c.fore), ellipse(x, 26, 2, 3, c.fore))
  }
  return out
}

function branches({ width, height, palette: c, rng }) {
  return hangers(width, height, c, rng, (x, h, cc, r) => {
    const parts = []
    const len = intOf(r, 60, 110)
    const dir = r() < 0.5 ? -1 : 1
    const endX = x + dir * len
    const endY = intOf(r, 14, h - 20)
    parts.push(line([x, 0, (x + endX) / 2, endY * 0.6, endX, endY], cc.fore, 1, 3))
    for (let i = 0; i < 7; i++) {
      const t = rangeOf(r, 0.3, 1)
      parts.push(ellipse(x + (endX - x) * t, endY * t + rangeOf(r, -6, 6), rangeOf(r, 6, 12), rangeOf(r, 4, 8), cc.fore))
    }
    return [parts, len]
  })
}

/** Painters by style name (see art/scenery.js). Each returns draw commands. */
export const STYLE_PAINTERS = {
  arches,
  gothic,
  wallpaper,
  skyline,
  lockers,
  shelves,
  chandeliers,
  street,
  temple,
  garage,
  bookPiles,
  lounge,
  park,
  parapet,
  hooks,
  cobwebs,
  valance,
  branches,
}

/** Draw commands for a style: `{ width, height, palette, rng }`. */
export function paintStyle(style, options) {
  const painter = STYLE_PAINTERS[style]
  if (!painter) throw new Error(`Unknown scenery style "${style}"`)
  return painter(options)
}
