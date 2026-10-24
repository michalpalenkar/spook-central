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
    // Scenery: far architecture is paler (fog), nearer layers darker.
    far: '#10172a',
    farLight: '#212c45',
    window: '#5d77a8',
    mid: '#0b0f1b',
    midLight: '#34405e',
    fore: '#030409',
    foreRim: '#4a5675',
    fog: '#4b5f8f',
    lamp: '#ffc276',
    mote: '#c9cfe0',
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
    far: '#0d1e22',
    farLight: '#21403f',
    window: '#8fd1c8',
    mid: '#08130f',
    midLight: '#2f5149',
    spine: ['#3b4f45', '#5a4a33', '#2c4048', '#553235', '#6b6448'],
    fore: '#020606',
    foreRim: '#6d7d6c',
    fog: '#4f8f88',
    lamp: '#f0dfa8',
    mote: '#efe4bf',
  },

  // Faded crimson wallpaper and tarnished gold.
  hotel: {
    skyTop: '#12070b',
    skyBottom: '#2a1016',
    brick: '#3a1a20',
    brickInterior: '#1f0d11',
    mortar: '#150709',
    edgeHighlight: '#c9a55a',
    edgeMid: '#5b2a2f',
    edgeShadow: '#090304',
    plank: '#4a3418',
    plankHighlight: '#d8b56a',
    plankShadow: '#1e1408',
    far: '#220c12',
    farLight: '#3c171f',
    window: '#d9a75a',
    mid: '#14060a',
    midLight: '#8a6a34',
    fore: '#070203',
    foreRim: '#8a6a3a',
    fog: '#7a3640',
    lamp: '#ffcf7a',
    mote: '#f0cf86',
  },

  // Storm purple stone, lightning-white edges.
  rooftop: {
    skyTop: '#0b0716',
    skyBottom: '#231a3d',
    brick: '#251d3b',
    brickInterior: '#140f22',
    mortar: '#0d0918',
    edgeHighlight: '#e6e4ff',
    edgeMid: '#43386a',
    edgeShadow: '#05030a',
    plank: '#2f2a3c',
    plankHighlight: '#b9b4d8',
    plankShadow: '#121019',
    far: '#181130',
    farLight: '#3a2f63',
    window: '#cfc8ff',
    mid: '#0d0920',
    midLight: '#6c62a6',
    fore: '#040309',
    foreRim: '#8a82c4',
    fog: '#5a4c92',
    lamp: '#e6e4ff',
    mote: '#b9b4e8',
  },

  // Outdoor rooms: the night sky and the skyline. Keyed by area.
  sky: {
    library: {
      top: '#03080d',
      bottom: '#163038',
      moon: '#e7efe0',
      moonGlow: '#8fd1c8',
      star: '#cfe4dc',
      cloud: '#0e2128',
      cloudLight: '#2a4b50',
      skyline: '#0c1a20',
      skylineBack: '#11252a',
      skylineLight: '#24403f',
      skylineWindow: '#e6d28c',
    },
    rooftop: {
      top: '#07040f',
      bottom: '#2a2050',
      moon: '#f4f2ff',
      moonGlow: '#8a7fd0',
      star: '#d8d4ff',
      cloud: '#1a1335',
      cloudLight: '#4a3f80',
      skyline: '#120c26',
      skylineBack: '#1f1842',
      skylineLight: '#3a3070',
      skylineWindow: '#f1dfa0',
    },
  },

  storm: {
    bolt: '#f4f2ff',
    boltCore: '#ffffff',
    flash: '#e9e6ff',
    rain: '#b9b4e8',
  },

  // Title and ending screens: the ghost drifting past the title, and the
  // dawn breaking over the city after the mascot falls, with marshmallow
  // puffs drifting down.
  title: {
    ghost: '#c8ffd9',
    glow: '#7dff6a',
  },
  ending: {
    dawn: '#ff9a62',
    puff: '#fff4ea',
  },

  // Screen-space atmosphere shared by every area.
  atmosphere: {
    vignette: '#020308',
    dust: '#d8d2bd',
  },

  // Gates: slimed walls, ectoplasm barriers, revealed spectral walls and
  // cracked weak floors. Shared by every area.
  gates: {
    slime: '#5fd14a',
    slimeDark: '#2f7a28',
    slimeShine: '#c8ffb0',
    barrier: '#3fa848',
    barrierCore: '#8dff7a',
    barrierShine: '#e0ffd0',
    spectral: '#9fe8ff',
    crack: '#f0e6c8',
    crackShadow: '#05060c',
    dust: '#a99f86',
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
    plate: '#05060c',
    ornament: '#c9bf9a',
    ornamentShade: '#4a4536',
    frame: '#8a93ad',
    frameShadow: '#05060c',
    cellEmpty: '#141826',
    cellFull: '#ff7a3c',
    cellCore: '#ffe0a0',
    cellFlash: '#ffffff',
    digit: '#d9e0ee',
  },

  // Bosses, Slimer, projectiles and ability relics.
  slimer: {
    body: '#8cf05a',
    shade: '#4fa83a',
    rim: '#e4ffc0',
    mouth: '#2a1012',
    tongue: '#e0566a',
    eyes: '#0c1a08',
    glow: '#9dff5a',
  },

  librarian: {
    robe: '#c9d6d0',
    robeShade: '#6f8a86',
    rim: '#f4fff8',
    face: '#e8efe6',
    hollow: '#0a1214',
    hair: '#8fa6a0',
    glow: '#7fffe0',
    // Shriek: the face turns into a skull-white scream.
    scream: '#fffbe8',
  },

  mallow: {
    body: '#f4efe6',
    shade: '#c8bfae',
    outline: '#1a1820',
    hat: '#2b4f9e',
    hatBand: '#d94545',
    collar: '#2b4f9e',
    bib: '#d94545',
    eyes: '#141018',
    mouth: '#5a2a2a',
    glow: '#ffe9c8',
    // Kneeling and exhausted.
    weakened: 0xc9b9a8,
  },

  projectiles: {
    bookCover: '#6b2a1e',
    bookPages: '#efe3c0',
    bookSpine: '#d1a650',
    glob: '#fbf6ec',
    globShade: '#c9bfae',
    shockwave: '#ffe9c8',
  },

  relic: {
    metal: '#3a3e4a',
    metalLight: '#9aa2b6',
    light: '#ff5a2c',
    ecto: '#7dff6a',
    boot: '#2c5a26',
    glow: '#fff2b0',
  },

  boss: {
    seal: '#7dff6a',
  },

  deathFlash: 0xffffff,
  // Bosses and ghosts flash this colour while the stream bites.
  hitFlash: 0xffffff,

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
