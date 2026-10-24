// Hanging lamps, one per area, as pixel rows. Keys: o outline (the area's
// foreground colour), m metal (its mid-layer rim), l the lit bulb or flame.
// The top-centre pixel is where the chain attaches.

export const LAMP_FRAMES = {
  // An enamel shop lamp over the garage.
  firehouse: ['....ooo....', '....omo....', '..ooooooo..', '.ommmmmmmo.', 'ooooooooooo', '...lllll...', '....lll....'],
  // A reading-room lantern.
  library: ['...o...', '..omo..', '.ooooo.', '.olllo.', '.olllo.', '.olllo.', '.ooooo.', '..omo..', '...o...'],
  // A small gilt chandelier.
  hotel: ['......o......', '.l..l.o.l..l.', '.m..m.o.m..m.', '.mmmmmmmmmmm.', '..mmmmmmmmm..', '....mmmmm....', '......m......', '......l......'],
  // Storm lantern for any covered rooftop space.
  rooftop: ['...o...', '..omo..', '.ooooo.', '.olllo.', '.olllo.', '.ooooo.'],
}

/** Size of a lamp frame. */
export function lampSize(area) {
  const rows = LAMP_FRAMES[area] ?? LAMP_FRAMES.firehouse
  return { width: rows[0].length, height: rows.length }
}
