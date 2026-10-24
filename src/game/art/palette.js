export const PALETTE = {
  void: '#05060c',

  accent: {
    ecto: '#7dff6a',
    proton: '#ff5a2c',
  },

  firehouse: {
    skyTop: '#0a0e1c',
    skyBottom: '#161c30',
    brick: '#1a2033',
    brickInterior: '#10141f',
    mortar: '#0b0e17',
    edgeHighlight: '#6d7a99',
    edgeMid: '#2b3450',
    edgeShadow: '#06070d',
    plank: '#3b2f2a',
    plankHighlight: '#8c7660',
    plankShadow: '#1d1614',
  },

  // Cold teal stone and parchment.
  library: {
    skyTop: '#060f13',
    skyBottom: '#10232a',
    brick: '#152a2e',
    brickInterior: '#0b1719',
    mortar: '#081113',
    edgeHighlight: '#b9b08f',
    edgeMid: '#2c4a4c',
    edgeShadow: '#040a0b',
    plank: '#3d3424',
    plankHighlight: '#c9b98a',
    plankShadow: '#1a160e',
  },

  pole: {
    brass: '#b08a3e',
    highlight: '#f3d98a',
    shadow: '#5a431b',
    glow: '#ffc76a',
  },

  ghost: {
    body: '#b9ffd0',
    bodyShade: '#5fd49a',
    rim: '#efffef',
    eyes: '#08140f',
    glow: '#7dff9a',
    // Tint while weakened: a sickly, dimmer green.
    weakened: 0x8fae9a,
  },

  stream: {
    core: '#fff6e0',
    inner: '#ffd06a',
    outer: '#ff5a2c',
    spark: '#ffe2a0',
    // The stream glows ecto-green where it grips a tethered ghost.
    grip: '#9dffb0',
  },

  trap: {
    shell: '#262833',
    shellHighlight: '#6a6f82',
    stripe: '#d8b23a',
    light: '#ff4a2a',
    lightArmed: '#7dff6a',
    beam: '#efffe0',
    pedal: '#0e0f15',
  },

  essence: {
    core: '#eaffde',
    glow: '#7dff6a',
  },

  hud: {
    frame: '#8a93ad',
    frameShadow: '#05060c',
    cellEmpty: '#141826',
    cellFull: '#ff7a3c',
    cellCore: '#ffe0a0',
    cellFlash: '#ffffff',
    digit: '#d9e0ee',
  },

  deathFlash: 0xffffff,

  // Keyed by the characters used in art/playerFrames.js.
  player: {
    o: '#0a0b12', // outline
    H: '#2b1e18', // hair
    s: '#c4977a', // skin
    b: '#b5a27f', // jumpsuit
    B: '#7f7259', // jumpsuit shade
    h: '#e3d9c0', // jumpsuit highlight
    P: '#3a3e4a', // proton pack
    r: '#e2452b', // pack light
    k: '#1c1a22', // boots and belt
  },
}
