import { semitone } from './soundRecipes.js'

// The ambient music: one slow synthesized pad per area, plus sparse bell
// notes picked at random from a scale. No melody and no recorded audio;
// systems/AudioEngine.js plays these.
//
// A recipe: { root (Hz), wave, drone (semitones above root, one oscillator
// each), detune (cents, alternating sign), cutoff and cutoffSwing (Hz, the
// pad's lowpass and how far a slow LFO sweeps it), lfoRate (Hz), droneGain,
// scale (semitones for the bells), noteBase (Hz), noteGain, noteLength (s),
// noteEvery ([min, max] seconds between bells) }.

const RECIPES = {
  // Minor and wide, under the title.
  title: {
    root: 55,
    wave: 'sawtooth',
    drone: [0, 7, 12, 15],
    detune: 7,
    cutoff: 480,
    cutoffSwing: 240,
    lfoRate: 0.07,
    droneGain: 0.5,
    scale: [0, 3, 7, 10, 12, 15],
    noteBase: 440,
    noteGain: 0.18,
    noteLength: 3.2,
    noteEvery: [2.5, 6],
  },
  // Warm and settled: the hub.
  firehouse: {
    root: 61.74,
    wave: 'triangle',
    drone: [0, 7, 12],
    detune: 5,
    cutoff: 700,
    cutoffSwing: 200,
    lfoRate: 0.05,
    droneGain: 0.55,
    scale: [0, 2, 4, 7, 9],
    noteBase: 493.9,
    noteGain: 0.14,
    noteLength: 2.6,
    noteEvery: [4, 9],
  },
  // Cold, hushed and airy.
  library: {
    root: 49,
    wave: 'sine',
    drone: [0, 7, 12, 14],
    detune: 9,
    cutoff: 420,
    cutoffSwing: 160,
    lfoRate: 0.04,
    droneGain: 0.6,
    scale: [0, 2, 6, 7, 11],
    noteBase: 392,
    noteGain: 0.16,
    noteLength: 3.6,
    noteEvery: [3, 7],
  },
  // Faded grandeur with a tritone underneath.
  hotel: {
    root: 58.27,
    wave: 'sawtooth',
    drone: [0, 6, 12, 15],
    detune: 11,
    cutoff: 380,
    cutoffSwing: 180,
    lfoRate: 0.09,
    droneGain: 0.45,
    scale: [0, 1, 5, 6, 10],
    noteBase: 466.2,
    noteGain: 0.13,
    noteLength: 2.4,
    noteEvery: [3.5, 8],
  },
  // Low and uneasy under the storm.
  rooftop: {
    root: 41.2,
    wave: 'sawtooth',
    drone: [0, 7, 12, 13],
    detune: 13,
    cutoff: 360,
    cutoffSwing: 220,
    lfoRate: 0.11,
    droneGain: 0.5,
    scale: [0, 1, 3, 7, 8],
    noteBase: 329.6,
    noteGain: 0.14,
    noteLength: 2.8,
    noteEvery: [3, 7],
  },
  // Dawn: major at last.
  ending: {
    root: 65.41,
    wave: 'triangle',
    drone: [0, 7, 12, 16],
    detune: 4,
    cutoff: 900,
    cutoffSwing: 300,
    lfoRate: 0.05,
    droneGain: 0.5,
    scale: [0, 2, 4, 7, 9, 12],
    noteBase: 523.3,
    noteGain: 0.16,
    noteLength: 3,
    noteEvery: [1.8, 4],
  },
}

export const AMBIENT_IDS = Object.keys(RECIPES)

/** The pad for an area or screen id, or null for silence. */
export function ambientRecipe(id) {
  return RECIPES[id] ?? null
}

/** The pad's oscillators: [{ freq, detune }]. */
export function droneVoices(recipe) {
  return recipe.drone.map((step, i) => ({ freq: semitone(recipe.root, step), detune: (i % 2 === 0 ? 1 : -1) * recipe.detune }))
}

/** The next bell: { freq, gain, wait } where `wait` is the time until it rings. */
export function nextAmbientNote(recipe, rng = Math.random) {
  const step = recipe.scale[Math.min(recipe.scale.length - 1, Math.floor(rng() * recipe.scale.length))]
  const [min, max] = recipe.noteEvery
  return {
    freq: semitone(recipe.noteBase, step),
    // Quieter now and then, so the bells don't march.
    gain: recipe.noteGain * (0.6 + rng() * 0.4),
    wait: min + rng() * (max - min),
  }
}
