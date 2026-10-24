// Firehouse: the hub. The garage has the fire pole (save point) and the
// new-game spawn; a ceiling hatch climbs to the bunk room (with the supply
// desk, the ability shop), a floor hatch drops into the basement and its
// containment unit, and the street door leads to the Library. The garage's
// west wall is spectral (`H`): with the PKE Meter it opens onto the
// Sedgewick Hotel.
//
// `#` solid, `=` one-way platform, `P` new-game spawn, `H` spectral wall.
// Origins, entity positions and exit spans are in tiles (see levels/exits.js).
export const FIREHOUSE_ROOMS = [
  {
    id: 'firehouse-garage',
    name: 'Garage',
    area: 'firehouse',
    origin: { x: 0, y: 0 },
    grid: [
      '###...##################################',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#.=====................................#',
      '#......................................#',
      '#.......====...........................#',
      '#......................................#',
      '#......................................#',
      '#.====.................................#',
      '#......................................#',
      'H.......................................',
      'H.......====............................',
      'H..........................###..........',
      'H.......................P..###..........',
      '##################################...###',
      '##################################...###',
    ],
    entities: [
      { type: 'pole', id: 'pole-garage', x: 20, y: 14 },
      // Listed before the climb hint, which it overlaps: the first match wins.
      { type: 'hint', id: 'spectral', x: 0, y: 10, width: 5, height: 5, requires: 'pke-meter' },
      { type: 'hint', id: 'move', x: 21, y: 9, width: 6, height: 6 },
      { type: 'hint', id: 'climb', x: 1, y: 3, width: 12, height: 12 },
      { type: 'hint', id: 'map', x: 31, y: 9, width: 8, height: 6 },
    ],
    exits: [
      { edge: 'left', span: [11, 14], to: 'hotel-lobby' },
      { edge: 'top', span: [3, 5], to: 'firehouse-upstairs' },
      { edge: 'right', span: [11, 14], to: 'library-steps' },
      { edge: 'bottom', span: [34, 36], to: 'firehouse-basement' },
    ],
  },
  {
    id: 'firehouse-upstairs',
    name: 'Bunk Room',
    area: 'firehouse',
    origin: { x: 0, y: -17 },
    grid: [
      '########################################',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#......................................#',
      '#.........=====...=====................#',
      '#......................................#',
      '#......................................#',
      '#.........=====...=====................#',
      '#.............................#####....#',
      '#.............................#####....#',
      '###...##################################',
      '###...##################################',
    ],
    entities: [
      { type: 'ghost', id: 'ghost-bunks', x: 27, y: 8 },
      { type: 'hint', id: 'combat', x: 1, y: 8, width: 20, height: 7 },
      // The supply desk: stand left of it and press up to buy.
      { type: 'shop', id: 'supply-desk', x: 29, y: 14 },
    ],
    exits: [{ edge: 'bottom', span: [3, 5], to: 'firehouse-garage' }],
  },
  {
    id: 'firehouse-basement',
    name: 'Containment',
    area: 'firehouse',
    origin: { x: 24, y: 17 },
    grid: [
      '##########...#################',
      '#............................#',
      '#............................#',
      '#.......=====................#',
      '#............................#',
      '#............................#',
      '#.............====...........#',
      '#............................#',
      '#............................#',
      '#.......====..........######.#',
      '#.....................######.#',
      '#.....................######.#',
      '#.............====....######.#',
      '#.....................######.#',
      '#.....................######.#',
      '##############################',
      '##############################',
    ],
    entities: [
      { type: 'ghost', id: 'ghost-basement', x: 18, y: 8 },
      { type: 'hint', id: 'trap', x: 1, y: 9, width: 14, height: 6 },
    ],
    exits: [{ edge: 'top', span: [10, 12], to: 'firehouse-garage' }],
  },
]
