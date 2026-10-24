import { AUDIO } from '../constants.js'

// Every sound in the game, as data for systems/AudioEngine.js to play with
// the Web Audio API. Nothing is recorded: each effect is a few voices,
// oscillators ("tone") or filtered white noise ("noise"), each with its own
// envelope.
//
// A voice: { kind, start, duration, gain, attack, hold, freq, wave, filter,
// vibrato }.
// - `start` is the delay from the sound's start; `duration` how long the
//   voice lasts. The envelope rises over `attack` to `gain`, stays there for
//   `hold`, then decays exponentially to silence at the end.
// - `freq` (tones) and `filter.freq` are a number, or a path of
//   [time, value] points ramped between exponentially.
// - `wave` is an OscillatorNode type; `filter` is { type, freq, q } for a
//   BiquadFilterNode; `vibrato` is { rate, depth } in Hz.

export const SOUND = {
  JUMP: 'jump',
  WALL_JUMP: 'wallJump',
  LAND: 'land',
  DASH: 'dash',
  PROTON_START: 'protonStart',
  TRAP_THROW: 'trapThrow',
  TRAP_OPEN: 'trapOpen',
  CAPTURE_BEAM: 'captureBeam',
  TRAP_SNAP: 'trapSnap',
  WAIL: 'wail',
  MOAN: 'moan',
  HURT: 'hurt',
  DEATH: 'death',
  ESSENCE: 'essence',
  RELIC: 'relic',
  SAVE: 'save',
  BUY: 'buy',
  DENIED: 'denied',
  CRUMBLE: 'crumble',
  SHRIEK: 'shriek',
  ROAR: 'roar',
  BOOK: 'book',
  GLOB: 'glob',
  STOMP: 'stomp',
  BOSS_DEFEAT: 'bossDefeat',
  THUNDER: 'thunder',
  UI_MOVE: 'uiMove',
  UI_SELECT: 'uiSelect',
  UI_BACK: 'uiBack',
  UI_OPEN: 'uiOpen',
}

const DEFAULT_ATTACK = 0.005

function tone(wave, freq, duration, { gain, attack = DEFAULT_ATTACK, hold = 0, start = 0, filter = null, vibrato = null } = {}) {
  return { kind: 'tone', wave, freq, duration, gain, attack, hold, start, filter, vibrato }
}

function noise(duration, { gain, attack = DEFAULT_ATTACK, hold = 0, start = 0, filter = null } = {}) {
  return { kind: 'noise', freq: null, duration, gain, attack, hold, start, filter, vibrato: null }
}

const lowpass = (freq, q = 1) => ({ type: 'lowpass', freq, q })
const highpass = (freq, q = 1) => ({ type: 'highpass', freq, q })
const bandpass = (freq, q = 1) => ({ type: 'bandpass', freq, q })

/** The frequency `semitones` above `base`. */
export function semitone(base, semitones) {
  return base * 2 ** (semitones / 12)
}

const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))]

// Pentatonic steps for chimes, so random notes never clash.
const PENTATONIC = [0, 2, 4, 7, 9]

const RECIPES = {
  [SOUND.JUMP]: () => [
    tone('square', [[0, 190], [0.11, 440]], 0.13, { gain: 0.1, filter: lowpass(1800) }),
    noise(0.06, { gain: 0.04, filter: highpass(2500) }),
  ],
  [SOUND.WALL_JUMP]: () => [
    tone('square', [[0, 240], [0.1, 560]], 0.12, { gain: 0.1, filter: lowpass(2000) }),
    noise(0.08, { gain: 0.08, filter: bandpass(1400, 3) }),
    tone('sine', [[0, 160], [0.1, 90]], 0.1, { gain: 0.08 }),
  ],
  // `strength` 0..1 scales a landing by how hard it was.
  [SOUND.LAND]: (_rng, { strength = 1 } = {}) => [
    noise(0.09, { gain: 0.22 * strength, filter: lowpass(500) }),
    tone('sine', [[0, 110], [0.08, 45]], 0.1, { gain: 0.16 * strength }),
  ],
  [SOUND.DASH]: () => [
    noise(0.22, { gain: 0.28, filter: { type: 'bandpass', freq: [[0, 2400], [0.2, 500]], q: 1.5 } }),
    tone('sawtooth', [[0, 320], [0.2, 110]], 0.2, { gain: 0.05, filter: lowpass(1200) }),
  ],
  [SOUND.PROTON_START]: () => [
    tone('sawtooth', [[0, 60], [0.05, 220], [0.18, 90]], 0.2, { gain: 0.12, filter: lowpass(2400) }),
    noise(0.18, { gain: 0.1, filter: highpass(3000) }),
  ],
  [SOUND.TRAP_THROW]: () => [
    noise(0.26, { gain: 0.16, filter: { type: 'bandpass', freq: [[0, 700], [0.25, 1800]], q: 2 } }),
    tone('square', [[0, 520], [0.04, 380]], 0.05, { gain: 0.05 }),
  ],
  [SOUND.TRAP_OPEN]: () => [
    noise(0.04, { gain: 0.24, filter: highpass(1800) }),
    tone('square', [[0, 330], [0.12, 660]], 0.14, { gain: 0.06, filter: lowpass(2500) }),
    tone('sine', 990, 0.3, { gain: 0.05, attack: 0.01, start: 0.04 }),
  ],
  [SOUND.CAPTURE_BEAM]: () => [
    tone('sawtooth', [[0, 180], [0.7, 1100]], 0.75, { gain: 0.06, filter: { type: 'lowpass', freq: [[0, 600], [0.7, 3500]], q: 2 } }),
    tone('triangle', [[0, 90], [0.7, 240]], 0.75, { gain: 0.09 }),
    noise(0.75, { gain: 0.05, attack: 0.2, filter: bandpass(2500, 2) }),
  ],
  [SOUND.TRAP_SNAP]: () => [
    noise(0.05, { gain: 0.32, filter: highpass(1500) }),
    tone('square', [[0, 900], [0.14, 180]], 0.16, { gain: 0.1, filter: lowpass(3000) }),
    tone('sine', 1320, 0.5, { gain: 0.07, start: 0.06 }),
    tone('sine', 1980, 0.45, { gain: 0.035, start: 0.06 }),
  ],
  // A ghost's wail: a sliding sine with a wobble, never quite the same twice.
  [SOUND.WAIL]: (rng) => {
    const base = 420 + rng() * 160
    const path = [[0, base], [0.35, base * 1.6], [0.9, base * 0.8], [1.2, base * 0.6]]
    const vibrato = { rate: 6 + rng() * 2, depth: 18 }
    return [
      tone('sine', path, 1.25, { gain: 0.08, attack: 0.15, vibrato }),
      tone('triangle', path.map(([t, f]) => [t, f * 1.5]), 1.25, { gain: 0.025, attack: 0.2, vibrato }),
    ]
  },
  [SOUND.MOAN]: () => [tone('sine', [[0, 330], [0.6, 180]], 0.7, { gain: 0.07, attack: 0.08, vibrato: { rate: 5, depth: 10 } })],
  [SOUND.HURT]: () => [
    tone('square', [[0, 260], [0.18, 90]], 0.2, { gain: 0.12, filter: lowpass(1600) }),
    noise(0.12, { gain: 0.18, filter: lowpass(1200) }),
  ],
  [SOUND.DEATH]: () => [
    tone('sawtooth', [[0, 440], [1.1, 55]], 1.2, {
      gain: 0.1,
      filter: { type: 'lowpass', freq: [[0, 2400], [1.1, 300]], q: 1 },
      vibrato: { rate: 8, depth: 12 },
    }),
    noise(0.5, { gain: 0.09, start: 0.05, filter: lowpass(600) }),
  ],
  // Orbs chime on a random pentatonic step.
  [SOUND.ESSENCE]: (rng) => {
    const freq = semitone(1046, pick(PENTATONIC, rng))
    return [tone('sine', freq, 0.35, { gain: 0.07, attack: 0.004 }), tone('sine', freq * 2, 0.18, { gain: 0.025 })]
  },
  [SOUND.RELIC]: () => [
    ...[0, 4, 7, 12, 16].map((step, i) => tone('triangle', semitone(523, step), 0.6, { gain: 0.06, start: i * 0.08 })),
    noise(0.9, { gain: 0.03, attack: 0.3, filter: highpass(6000) }),
  ],
  [SOUND.SAVE]: () => [
    ...[0, 4, 7].map((step, i) => tone('triangle', semitone(262, step), 1.4, { gain: 0.05, attack: 0.08, start: i * 0.05, filter: lowpass(1800) })),
    tone('sine', 1046, 1, { gain: 0.03, start: 0.15, attack: 0.05 }),
  ],
  [SOUND.BUY]: () => [tone('sine', 1318, 0.12, { gain: 0.07 }), tone('sine', 1760, 0.3, { gain: 0.07, start: 0.09 })],
  [SOUND.DENIED]: () => [
    tone('square', 150, 0.09, { gain: 0.07, filter: lowpass(900) }),
    tone('square', 150, 0.12, { gain: 0.07, start: 0.12, filter: lowpass(900) }),
  ],
  [SOUND.CRUMBLE]: () => [
    noise(0.5, { gain: 0.32, filter: { type: 'lowpass', freq: [[0, 900], [0.45, 200]], q: 1 } }),
    tone('sine', [[0, 80], [0.4, 38]], 0.45, { gain: 0.18 }),
    noise(0.25, { gain: 0.07, start: 0.05, filter: bandpass(2000, 2) }),
  ],
  // The Librarian waking: a sliding shriek.
  [SOUND.SHRIEK]: () => {
    const path = [[0, 700], [0.25, 1500], [0.9, 620]]
    return [
      tone('sine', path, 1, { gain: 0.07, attack: 0.03, vibrato: { rate: 11, depth: 40 } }),
      tone('sawtooth', path.map(([t, f]) => [t, f / 2]), 1, { gain: 0.025, filter: lowpass(2000) }),
      noise(0.9, { gain: 0.04, attack: 0.2, filter: bandpass(3500, 2) }),
    ]
  },
  // The mascot's roar.
  [SOUND.ROAR]: () => [
    tone('sawtooth', [[0, 120], [0.3, 95], [1.1, 70]], 1.2, { gain: 0.12, attack: 0.05, filter: lowpass(700), vibrato: { rate: 9, depth: 6 } }),
    tone('square', [[0, 60], [1.1, 45]], 1.2, { gain: 0.06, attack: 0.05, filter: lowpass(400) }),
    noise(1, { gain: 0.1, attack: 0.1, filter: lowpass(500) }),
  ],
  // A book flapping through the air.
  [SOUND.BOOK]: () => [0, 0.06, 0.12].map((start) => noise(0.05, { gain: 0.12, start, filter: bandpass(1200, 4) })),
  [SOUND.GLOB]: () => [tone('sine', [[0, 420], [0.12, 140]], 0.16, { gain: 0.1 }), noise(0.05, { gain: 0.05, filter: lowpass(900) })],
  [SOUND.STOMP]: () => [
    tone('sine', [[0, 70], [0.5, 30]], 0.6, { gain: 0.28 }),
    noise(0.6, { gain: 0.28, filter: { type: 'lowpass', freq: [[0, 500], [0.5, 120]], q: 1 } }),
  ],
  [SOUND.BOSS_DEFEAT]: () => [
    tone('sawtooth', [[0, 300], [1.6, 40]], 1.8, { gain: 0.09, filter: lowpass(1500), vibrato: { rate: 7, depth: 10 } }),
    noise(1.6, { gain: 0.22, filter: { type: 'lowpass', freq: [[0, 2000], [1.5, 150]], q: 1 } }),
    ...[0, 7, 12].map((step, i) => tone('triangle', semitone(784, step), 0.9, { gain: 0.05, start: 0.8 + i * 0.12 })),
  ],
  // Thunder: a crack, then a long rumble. `gain` sets how close it struck.
  [SOUND.THUNDER]: (_rng, { gain = AUDIO.THUNDER_GAIN_NEAR } = {}) => [
    noise(0.12, { gain: gain * 0.5, filter: highpass(1200) }),
    noise(3.2, { gain, attack: 0.05, start: 0.03, filter: { type: 'lowpass', freq: [[0, 700], [3, 90]], q: 1 } }),
    noise(2.4, { gain: gain * 0.7, attack: 0.3, start: 0.5, filter: lowpass(220) }),
    tone('sine', [[0, 48], [2.5, 30]], 2.6, { gain: gain * 0.25, attack: 0.1, start: 0.1 }),
  ],
  [SOUND.UI_MOVE]: () => [tone('sine', 880, 0.05, { gain: 0.045 })],
  [SOUND.UI_SELECT]: () => [tone('triangle', [[0, 660], [0.08, 990]], 0.12, { gain: 0.06 }), tone('sine', 1320, 0.2, { gain: 0.025, start: 0.05 })],
  [SOUND.UI_BACK]: () => [tone('triangle', [[0, 660], [0.1, 440]], 0.12, { gain: 0.055 })],
  [SOUND.UI_OPEN]: () => [tone('triangle', [[0, 440], [0.12, 660]], 0.15, { gain: 0.055 })],
}

export const SOUND_NAMES = Object.keys(RECIPES)

function scaleFreq(freq, factor) {
  if (freq === null) return null
  return typeof freq === 'number' ? freq * factor : freq.map(([t, f]) => [t, f * factor])
}

/**
 * The voices of sound `name`, with a little random pitch variation so
 * repeats don't sound mechanical. Returns null for an unknown name.
 */
export function buildSound(name, rng = Math.random, options = {}) {
  const recipe = RECIPES[name]
  if (!recipe) return null
  const factor = 1 + (rng() * 2 - 1) * AUDIO.PITCH_JITTER
  return recipe(rng, options).map((voice) => ({
    ...voice,
    freq: scaleFreq(voice.freq, factor),
    filter: voice.filter && { ...voice.filter, freq: scaleFreq(voice.filter.freq, factor) },
  }))
}

/** How long a sound lasts, in seconds. */
export function soundLength(voices) {
  return Math.max(0, ...voices.map((v) => v.start + v.duration))
}

/** Where a strike's thunder lands: { delay, gain }; later means farther and quieter. */
export function thunderParams(rng = Math.random) {
  const t = rng()
  return {
    delay: AUDIO.THUNDER_DELAY_MIN + t * (AUDIO.THUNDER_DELAY_MAX - AUDIO.THUNDER_DELAY_MIN),
    gain: AUDIO.THUNDER_GAIN_NEAR + t * (AUDIO.THUNDER_GAIN_FAR - AUDIO.THUNDER_GAIN_NEAR),
  }
}

/**
 * Whether an effect may start now: not more often than AUDIO.MIN_GAP for the
 * same name, and only while fewer than AUDIO.MAX_VOICES voices play.
 * `lastPlayed` maps names to start times.
 */
export function canPlay(lastPlayed, name, now, voicesPlaying, voicesNeeded = 1) {
  if (voicesPlaying + voicesNeeded > AUDIO.MAX_VOICES) return false
  const last = lastPlayed.get(name)
  return last === undefined || now - last >= AUDIO.MIN_GAP
}

/**
 * The gains of the mixer's buses for the settings: `master` (volume, or 0
 * muted), `sfx` and `music` (the music slider, ducked while paused).
 */
export function busGains(settings, paused = false) {
  return {
    master: settings.muted ? 0 : settings.volume * AUDIO.MASTER_GAIN,
    sfx: AUDIO.SFX_GAIN,
    music: settings.music * AUDIO.MUSIC_GAIN * (paused ? AUDIO.PAUSE_DUCK : 1),
  }
}
