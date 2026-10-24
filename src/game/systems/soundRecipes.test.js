import { describe, expect, it } from 'vitest'
import { AUDIO } from '../constants.js'
import { createRng } from '../art/rng.js'
import { AMBIENT_IDS, ambientRecipe, droneVoices, nextAmbientNote } from './ambientRecipes.js'
import { SOUND, SOUND_NAMES, busGains, buildSound, canPlay, semitone, soundLength, thunderParams } from './soundRecipes.js'

const WAVES = new Set(['sine', 'square', 'sawtooth', 'triangle'])
const FILTERS = new Set(['lowpass', 'highpass', 'bandpass'])

// A frequency is a positive number or a path of [time, value] points that
// starts at 0, runs forward in time and ends within the voice.
function pathProblems(freq, duration) {
  if (typeof freq === 'number') return freq > 0 && freq < 20000 ? [] : [`bad frequency ${freq}`]
  if (!Array.isArray(freq) || freq.length < 2) return ['bad path']
  const problems = []
  if (freq[0][0] !== 0) problems.push('path must start at 0')
  freq.forEach(([t, f], i) => {
    if (!(f > 0 && f < 20000)) problems.push(`bad path frequency ${f}`)
    if (i > 0 && t <= freq[i - 1][0]) problems.push('path must move forward in time')
    if (t > duration) problems.push('path runs past the voice')
  })
  return problems
}

function voiceProblems(v) {
  const problems = []
  if (v.kind !== 'tone' && v.kind !== 'noise') problems.push(`kind ${v.kind}`)
  if (!(v.duration > 0)) problems.push('duration')
  if (!(v.start >= 0)) problems.push('start')
  if (!(v.gain > 0 && v.gain <= 1)) problems.push(`gain ${v.gain}`)
  if (!(v.attack > 0) || v.attack + v.hold >= v.duration) problems.push('envelope')
  if (v.kind === 'tone') {
    if (!WAVES.has(v.wave)) problems.push(`wave ${v.wave}`)
    problems.push(...pathProblems(v.freq, v.duration))
  }
  if (v.filter) {
    if (!FILTERS.has(v.filter.type)) problems.push(`filter ${v.filter.type}`)
    problems.push(...pathProblems(v.filter.freq, v.duration))
  }
  if (v.vibrato && !(v.vibrato.rate > 0 && v.vibrato.depth > 0)) problems.push('vibrato')
  return problems
}

describe('sound recipes', () => {
  it('has a recipe for every named sound', () => {
    expect(new Set(SOUND_NAMES)).toEqual(new Set(Object.values(SOUND)))
  })

  it.each(SOUND_NAMES)('builds valid voices for %s', (name) => {
    for (const seed of [1, 2, 3]) {
      const voices = buildSound(name, createRng(seed))
      expect(voices.length).toBeGreaterThan(0)
      for (const voice of voices) expect(voiceProblems(voice)).toEqual([])
      expect(soundLength(voices)).toBeLessThan(4)
    }
  })

  it('is deterministic for a seed and varies pitch only slightly', () => {
    expect(buildSound(SOUND.JUMP, createRng(5))).toEqual(buildSound(SOUND.JUMP, createRng(5)))
    const low = buildSound(SOUND.UI_MOVE, () => 0)[0].freq
    const high = buildSound(SOUND.UI_MOVE, () => 0.9999)[0].freq
    expect(low).toBeCloseTo(880 * (1 - AUDIO.PITCH_JITTER))
    expect(high).toBeCloseTo(880 * (1 + AUDIO.PITCH_JITTER), 1)
  })

  it('returns null for an unknown sound', () => {
    expect(buildSound('kazoo')).toBeNull()
  })

  it('scales landings and thunder by their options', () => {
    const soft = buildSound(SOUND.LAND, () => 0.5, { strength: 0.25 })
    const hard = buildSound(SOUND.LAND, () => 0.5, { strength: 1 })
    expect(soft[0].gain).toBeCloseTo(hard[0].gain / 4)
    const far = buildSound(SOUND.THUNDER, () => 0.5, { gain: AUDIO.THUNDER_GAIN_FAR })
    const near = buildSound(SOUND.THUNDER, () => 0.5, { gain: AUDIO.THUNDER_GAIN_NEAR })
    expect(far[1].gain).toBeLessThan(near[1].gain)
  })

  it('makes later thunder quieter', () => {
    const near = thunderParams(() => 0)
    const far = thunderParams(() => 1)
    expect(near).toEqual({ delay: AUDIO.THUNDER_DELAY_MIN, gain: AUDIO.THUNDER_GAIN_NEAR })
    expect(far.delay).toBeCloseTo(AUDIO.THUNDER_DELAY_MAX)
    expect(far.gain).toBeCloseTo(AUDIO.THUNDER_GAIN_FAR)
  })

  it('computes semitones', () => {
    expect(semitone(440, 12)).toBeCloseTo(880)
    expect(semitone(440, -12)).toBeCloseTo(220)
  })
})

describe('canPlay', () => {
  it('limits how often one sound repeats', () => {
    const last = new Map([[SOUND.ESSENCE, 1]])
    expect(canPlay(last, SOUND.ESSENCE, 1 + AUDIO.MIN_GAP / 2, 0)).toBe(false)
    expect(canPlay(last, SOUND.ESSENCE, 1 + AUDIO.MIN_GAP, 0)).toBe(true)
    expect(canPlay(last, SOUND.JUMP, 1, 0)).toBe(true)
  })

  it('drops sounds over the voice budget', () => {
    expect(canPlay(new Map(), SOUND.JUMP, 0, AUDIO.MAX_VOICES - 2, 2)).toBe(true)
    expect(canPlay(new Map(), SOUND.JUMP, 0, AUDIO.MAX_VOICES - 1, 2)).toBe(false)
  })
})

describe('busGains', () => {
  const settings = { volume: 0.5, music: 0.5, muted: false }

  it('follows the volume sliders', () => {
    expect(busGains(settings)).toEqual({ master: 0.5 * AUDIO.MASTER_GAIN, sfx: AUDIO.SFX_GAIN, music: 0.5 * AUDIO.MUSIC_GAIN })
  })

  it('silences everything when muted', () => {
    expect(busGains({ ...settings, muted: true }).master).toBe(0)
  })

  it('ducks the music while paused', () => {
    expect(busGains(settings, true).music).toBeCloseTo(0.5 * AUDIO.MUSIC_GAIN * AUDIO.PAUSE_DUCK)
  })
})

describe('ambient recipes', () => {
  it('has a pad for every area, the title and the ending', () => {
    for (const id of ['title', 'firehouse', 'library', 'hotel', 'rooftop', 'ending']) expect(AMBIENT_IDS).toContain(id)
    expect(ambientRecipe('nowhere')).toBeNull()
    expect(ambientRecipe(null)).toBeNull()
  })

  it.each(AMBIENT_IDS)('builds a sane pad for %s', (id) => {
    const recipe = ambientRecipe(id)
    expect(WAVES.has(recipe.wave)).toBe(true)
    const voices = droneVoices(recipe)
    expect(voices).toHaveLength(recipe.drone.length)
    for (const v of voices) expect(v.freq).toBeGreaterThan(20)
    expect(recipe.cutoff - recipe.cutoffSwing).toBeGreaterThan(0)
    expect(recipe.droneGain).toBeLessThanOrEqual(1)

    const rng = createRng(7)
    for (let i = 0; i < 20; i++) {
      const note = nextAmbientNote(recipe, rng)
      expect(note.wait).toBeGreaterThanOrEqual(recipe.noteEvery[0])
      expect(note.wait).toBeLessThanOrEqual(recipe.noteEvery[1])
      expect(note.gain).toBeLessThanOrEqual(recipe.noteGain)
      expect(recipe.scale.map((s) => semitone(recipe.noteBase, s))).toContainEqual(note.freq)
    }
  })

  it('detunes the pad voices in alternate directions', () => {
    const voices = droneVoices(ambientRecipe('title'))
    expect(voices[0].detune).toBe(-voices[1].detune)
  })
})
