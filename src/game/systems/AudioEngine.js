import { AUDIO } from '../constants.js'
import { ambientRecipe, droneVoices, nextAmbientNote } from './ambientRecipes.js'
import { busGains, buildSound, canPlay, thunderParams } from './soundRecipes.js'

const MS = 1000

function audioContextClass() {
  return globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null
}

// Sets an AudioParam to a number, or along a [time, value] path from `start`.
function setPath(param, path, start) {
  if (typeof path === 'number') {
    param.setValueAtTime(path, start)
    return
  }
  param.setValueAtTime(path[0][1], start + path[0][0])
  for (let i = 1; i < path.length; i++) param.exponentialRampToValueAtTime(Math.max(path[i][1], AUDIO.SILENCE), start + path[i][0])
}

/**
 * Every sound in the game, made with the Web Audio API: effects from
 * systems/soundRecipes.js, the proton stream's hum, and an ambient pad per
 * area (systems/ambientRecipes.js). Nothing is loaded.
 *
 * App creates one and hands it to the game through the registry. There is
 * no AudioContext until `unlock()` runs inside a user gesture (iOS starts
 * audio only there); until then every call is a cheap no-op, and the
 * wanted ambient and settings are remembered for when it starts.
 *
 * Graph: voices → sfx bus ─┐
 *        pads   → music bus ┴→ master (volume, mute) → compressor → speakers
 */
export class AudioEngine {
  constructor(settings, { rng = Math.random } = {}) {
    this.settings = settings
    this.rng = rng
    this.ctx = null
    this.paused = false
    this.voices = 0
    this.lastPlayed = new Map()
    this.hum = null
    this.ambient = null
    this.ambientId = null
    this.timers = new Set()
    this.failed = false
  }

  /** Creates or resumes the AudioContext. Call from a user gesture. */
  unlock() {
    if (this.failed) return
    if (!this.ctx) this.createContext()
    if (this.ctx && this.ctx.state !== 'running' && !document.hidden) this.ctx.resume().catch(() => {})
  }

  createContext() {
    const Context = audioContextClass()
    if (!Context) {
      this.failed = true
      return
    }
    try {
      this.ctx = new Context({ latencyHint: 'interactive' })
    } catch {
      this.failed = true
      return
    }
    const ctx = this.ctx
    this.compressor = ctx.createDynamicsCompressor()
    this.compressor.connect(ctx.destination)
    this.master = ctx.createGain()
    this.master.connect(this.compressor)
    this.sfx = ctx.createGain()
    this.sfx.connect(this.master)
    this.music = ctx.createGain()
    this.music.connect(this.master)
    this.applyGains(true)

    // One second of white noise, shared by every noise voice.
    const length = Math.floor(ctx.sampleRate * AUDIO.NOISE_SECONDS)
    this.noise = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = this.noise.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = this.rng() * 2 - 1

    // A pad scheduled on a suspended context starts when it resumes.
    if (this.ambientId) this.startAmbient(this.ambientId)
  }

  get running() {
    return this.ctx?.state === 'running'
  }

  /** Applies new settings (volume, music, mute). */
  configure(settings) {
    this.settings = settings
    this.applyGains()
  }

  /** Paused: the music ducks and the hum stops. */
  setPaused(paused) {
    this.paused = paused
    if (paused) this.setHum(false)
    this.applyGains()
  }

  applyGains(immediate = false) {
    if (!this.ctx) return
    const gains = busGains(this.settings, this.paused)
    const now = this.ctx.currentTime
    for (const [bus, value] of [
      [this.master, gains.master],
      [this.sfx, gains.sfx],
      [this.music, gains.music],
    ]) {
      if (immediate) bus.gain.setValueAtTime(value, now)
      else bus.gain.setTargetAtTime(value, now, AUDIO.RAMP_TIME)
    }
  }

  /** Suspends audio while the page is hidden. */
  suspend() {
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => {})
  }

  resume() {
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {})
  }

  /**
   * Plays an effect from systems/soundRecipes.js. `delay` starts it later
   * (seconds); other options go to the recipe. Returns whether it played.
   */
  play(name, { delay = 0, ...options } = {}) {
    if (!this.running) return false
    const now = this.ctx.currentTime
    const voices = buildSound(name, this.rng, options)
    if (!voices || !canPlay(this.lastPlayed, name, now, this.voices, voices.length)) return false
    this.lastPlayed.set(name, now)
    const start = now + delay
    for (const voice of voices) this.playVoice(voice, start, this.sfx)
    return true
  }

  /** Thunder after a lightning strike, delayed and quieter the farther it was. */
  thunder() {
    const { delay, gain } = thunderParams(this.rng)
    return this.play('thunder', { delay, gain })
  }

  playVoice(voice, t0, bus) {
    const ctx = this.ctx
    const start = t0 + voice.start
    const end = start + voice.duration
    let source
    if (voice.kind === 'tone') {
      source = ctx.createOscillator()
      source.type = voice.wave
      setPath(source.frequency, voice.freq, start)
    } else {
      source = ctx.createBufferSource()
      source.buffer = this.noise
      source.loop = true
    }

    let node = source
    let filter = null
    if (voice.filter) {
      filter = ctx.createBiquadFilter()
      filter.type = voice.filter.type
      filter.Q.value = voice.filter.q ?? 1
      setPath(filter.frequency, voice.filter.freq, start)
      node.connect(filter)
      node = filter
    }

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(AUDIO.SILENCE, start)
    gain.gain.linearRampToValueAtTime(voice.gain, start + voice.attack)
    gain.gain.setValueAtTime(voice.gain, start + voice.attack + voice.hold)
    gain.gain.exponentialRampToValueAtTime(AUDIO.SILENCE, end)
    node.connect(gain)
    gain.connect(bus)

    let lfo = null
    let lfoGain = null
    if (voice.vibrato && voice.kind === 'tone') {
      lfo = ctx.createOscillator()
      lfo.frequency.value = voice.vibrato.rate
      lfoGain = ctx.createGain()
      lfoGain.gain.value = voice.vibrato.depth
      lfo.connect(lfoGain)
      lfoGain.connect(source.frequency)
      lfo.start(start)
      lfo.stop(end)
    }

    this.voices++
    source.onended = () => {
      this.voices--
      for (const n of [source, filter, gain, lfo, lfoGain]) n?.disconnect()
    }
    // Noise starts at a random spot in the buffer so repeats differ.
    if (voice.kind === 'noise') source.start(start, this.rng() * AUDIO.NOISE_SECONDS)
    else source.start(start)
    source.stop(end)
  }

  /**
   * The proton stream's hum: on while fire is held, rising when it has a
   * ghost on the line. Cheap to call every frame; it only acts on changes.
   */
  setHum(on, tethered = false) {
    if (!on || !this.running) {
      if (this.hum) this.stopHum()
      return
    }
    if (!this.hum) this.startHum()
    if (this.hum.tethered !== tethered) {
      this.hum.tethered = tethered
      const now = this.ctx.currentTime
      const pitch = tethered ? AUDIO.HUM_TETHER_PITCH : 1
      this.hum.oscillators.forEach((osc, i) => osc.frequency.setTargetAtTime(AUDIO.HUM_BASE * (i + 1) * pitch, now, AUDIO.RAMP_TIME))
      this.hum.filter.frequency.setTargetAtTime(AUDIO.HUM_CUTOFF * (tethered ? AUDIO.HUM_TETHER_CUTOFF : 1), now, AUDIO.RAMP_TIME)
    }
  }

  startHum() {
    const ctx = this.ctx
    const now = ctx.currentTime
    const out = ctx.createGain()
    out.gain.setValueAtTime(AUDIO.SILENCE, now)
    out.gain.linearRampToValueAtTime(AUDIO.HUM_GAIN, now + AUDIO.HUM_ATTACK)
    out.connect(this.sfx)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = AUDIO.HUM_CUTOFF
    filter.Q.value = 4
    filter.connect(out)

    // Two saws an octave apart, slightly detuned, through a wobbling filter.
    const oscillators = [0, 1].map((i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'
      osc.frequency.value = AUDIO.HUM_BASE * (i + 1)
      osc.detune.value = i === 0 ? -6 : 6
      osc.connect(filter)
      osc.start(now)
      return osc
    })
    const wobble = ctx.createOscillator()
    wobble.frequency.value = AUDIO.HUM_WOBBLE_RATE
    const wobbleDepth = ctx.createGain()
    wobbleDepth.gain.value = AUDIO.HUM_WOBBLE_DEPTH
    wobble.connect(wobbleDepth)
    wobbleDepth.connect(filter.frequency)
    wobble.start(now)

    // A thin crackle of noise on top.
    const crackle = ctx.createBufferSource()
    crackle.buffer = this.noise
    crackle.loop = true
    const crackleFilter = ctx.createBiquadFilter()
    crackleFilter.type = 'bandpass'
    crackleFilter.frequency.value = AUDIO.HUM_CRACKLE_FREQ
    const crackleGain = ctx.createGain()
    crackleGain.gain.value = AUDIO.HUM_CRACKLE_GAIN / AUDIO.HUM_GAIN
    crackle.connect(crackleFilter)
    crackleFilter.connect(crackleGain)
    crackleGain.connect(out)
    crackle.start(now)

    this.hum = { out, filter, oscillators, sources: [...oscillators, wobble, crackle], nodes: [wobbleDepth, crackleFilter, crackleGain], tethered: false }
  }

  stopHum() {
    const hum = this.hum
    this.hum = null
    const now = this.ctx.currentTime
    hum.out.gain.cancelScheduledValues(now)
    hum.out.gain.setTargetAtTime(AUDIO.SILENCE, now, AUDIO.HUM_RELEASE / 3)
    for (const source of hum.sources) source.stop(now + AUDIO.HUM_RELEASE)
    hum.sources[0].onended = () => {
      for (const node of [...hum.sources, ...hum.nodes, hum.filter, hum.out]) node.disconnect()
    }
  }

  /** Cross-fades to the pad for an area or screen id ('title', 'ending'), or to silence with null. */
  setAmbient(id) {
    if (id === this.ambientId) return
    this.ambientId = id
    if (!this.ctx) return
    this.stopAmbient()
    this.startAmbient(id)
  }

  startAmbient(id) {
    const recipe = ambientRecipe(id)
    if (!recipe || !this.ctx) return
    const ctx = this.ctx
    const now = ctx.currentTime
    const out = ctx.createGain()
    out.gain.setValueAtTime(AUDIO.SILENCE, now)
    out.gain.linearRampToValueAtTime(1, now + AUDIO.AMBIENT_FADE)
    out.connect(this.music)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = recipe.cutoff
    filter.connect(out)
    const lfo = ctx.createOscillator()
    lfo.frequency.value = recipe.lfoRate
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = recipe.cutoffSwing
    lfo.connect(lfoDepth)
    lfoDepth.connect(filter.frequency)
    lfo.start(now)

    const voices = droneVoices(recipe)
    const padGain = ctx.createGain()
    padGain.gain.value = recipe.droneGain / voices.length
    padGain.connect(filter)
    const oscillators = voices.map(({ freq, detune }) => {
      const osc = ctx.createOscillator()
      osc.type = recipe.wave
      osc.frequency.value = freq
      osc.detune.value = detune
      osc.connect(padGain)
      osc.start(now)
      return osc
    })

    const ambient = { id, recipe, out, sources: [lfo, ...oscillators], nodes: [filter, lfoDepth, padGain], timer: null }
    this.ambient = ambient
    this.scheduleBell(ambient)
  }

  // Sparse bells over the pad, on a timer; skipped while suspended so they
  // don't pile up.
  scheduleBell(ambient) {
    const note = nextAmbientNote(ambient.recipe, this.rng)
    const timer = setTimeout(() => {
      this.timers.delete(timer)
      if (this.ambient !== ambient) return
      if (this.running) {
        const start = this.ctx.currentTime
        this.playVoice(
          { kind: 'tone', wave: 'sine', freq: note.freq, duration: ambient.recipe.noteLength, gain: note.gain, attack: 0.02, hold: 0, start: 0, filter: null, vibrato: null },
          start,
          ambient.out,
        )
      }
      this.scheduleBell(ambient)
    }, note.wait * MS)
    this.timers.add(timer)
    ambient.timer = timer
  }

  stopAmbient() {
    const ambient = this.ambient
    if (!ambient) return
    this.ambient = null
    clearTimeout(ambient.timer)
    this.timers.delete(ambient.timer)
    const now = this.ctx.currentTime
    ambient.out.gain.cancelScheduledValues(now)
    ambient.out.gain.setValueAtTime(ambient.out.gain.value, now)
    ambient.out.gain.linearRampToValueAtTime(AUDIO.SILENCE, now + AUDIO.AMBIENT_FADE)
    for (const source of ambient.sources) source.stop(now + AUDIO.AMBIENT_FADE + 0.05)
    ambient.sources[0].onended = () => {
      for (const node of [...ambient.sources, ...ambient.nodes, ambient.out]) node.disconnect()
    }
  }

  /** For debugging and automated checks. */
  stats() {
    return {
      state: this.ctx?.state ?? 'none',
      voices: this.voices,
      hum: Boolean(this.hum),
      humTethered: this.hum?.tethered ?? false,
      ambient: this.ambient?.id ?? null,
      wantedAmbient: this.ambientId,
      lastPlayed: [...this.lastPlayed.keys()],
    }
  }
}
