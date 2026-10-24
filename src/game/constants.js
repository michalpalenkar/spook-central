// Internal render resolution. The canvas is scaled to fit the window.
export const GAME_WIDTH = 480
export const GAME_HEIGHT = 270

export const TILE_SIZE = 16

// Longest frame step the simulation will take, in seconds. Longer frames
// (tab switches, hitches) are clamped so bodies can't tunnel through tiles.
export const MAX_FRAME_DELTA = 1 / 30

// Distances in px, speeds in px/s, accelerations in px/s², times in seconds.
export const PLAYER = {
  BODY_WIDTH: 10,
  BODY_HEIGHT: 22,

  RUN_SPEED: 135,
  GROUND_ACCEL: 2400,
  GROUND_DECEL: 3000,
  AIR_ACCEL: 1800,
  AIR_DECEL: 1200,

  // Apex of a full jump is JUMP_VELOCITY² / (2 · GRAVITY) ≈ 70 px (4.3 tiles).
  JUMP_VELOCITY: 400,
  GRAVITY: 1150,
  FALL_GRAVITY_MULTIPLIER: 1.35,
  MAX_FALL_SPEED: 420,
  // Upward speed is multiplied by this when jump is released early.
  JUMP_CUT_MULTIPLIER: 0.4,

  COYOTE_TIME: 0.1,
  JUMP_BUFFER_TIME: 0.1,
}

// Ability movement: Ecto-Dash and Slime Boots (wall cling and wall jump).
export const PLAYER_MOVES = {
  // A dash covers DASH_SPEED · DASH_TIME ≈ 70 px (4.4 tiles), ignoring gravity.
  DASH_SPEED: 410,
  DASH_TIME: 0.17,
  DASH_COOLDOWN: 0.3,
  // Speed kept when a dash ends.
  DASH_EXIT_SPEED: 135,
  // A dash that ends inside an ectoplasm barrier keeps going until it's clear,
  // but never longer than this in total.
  DASH_MAX_TIME: 0.4,

  // Clinging to a slimed wall caps the fall speed.
  WALL_SLIDE_SPEED: 45,
  WALL_JUMP_VELOCITY: 380,
  WALL_JUMP_PUSH: 170,
  // After a wall jump, horizontal input is ignored this long so the kick lands.
  WALL_JUMP_LOCK: 0.13,
  // A wall jump still works this long after letting go of the wall.
  WALL_COYOTE_TIME: 0.08,
}

export const PLAYER_FEEL = {
  JUMP_STRETCH_X: 0.8,
  JUMP_STRETCH_Y: 1.2,
  // Squash at MAX_FALL_SPEED; softer landings scale down toward none.
  LAND_SQUASH_X: 1.3,
  LAND_SQUASH_Y: 0.75,
  LAND_SQUASH_MIN_SPEED: 100,
  // Exponential recovery rate back to scale 1, per second.
  SQUASH_RECOVERY_RATE: 14,

  RUN_ANIM_FPS: 10,
  RUN_ANIM_MIN_SPEED: 20,
}

// A one-way platform only catches a body whose feet were at most this far
// below its top on the previous step.
export const PLATFORM_LANDING_TOLERANCE = 2

export const CAMERA = {
  LERP_X: 0.15,
  LERP_Y: 0.12,
  DEADZONE_WIDTH: 32,
  DEADZONE_HEIGHT: 48,
}

export const TOUCH = {
  // Fraction of the D-pad radius around its centre that registers no direction.
  DPAD_DEADZONE: 0.22,
  // Half-width of each diagonal sector, in degrees. Inside it both directions
  // are held; outside it only the nearest one.
  DPAD_DIAGONAL_HALF_ANGLE: 22.5,
}

export const GAMEPAD = {
  // Stick deflection (0..1) below which an axis reads as centred.
  STICK_DEADZONE: 0.35,
  // Analog trigger value above which it counts as pressed.
  TRIGGER_THRESHOLD: 0.4,
}

// Vibration lengths in ms, for navigator.vibrate.
export const HAPTICS = {
  HIT: 40,
}

// Draw order of world objects.
export const DEPTH = {
  BACKDROP: -10,
  SKY_BOLT: -9.5,
  SCENERY_FAR: -9,
  SCENERY_MID: -8,
  FOG_BACK: -7,
  LAMP: -2,
  POLE: -1,
  SHOP: -1,
  ROOM: 0,
  GATES: 1,
  RELIC: 7,
  TRAP_BEAM: 4,
  TRAP: 5,
  ORB: 6,
  PLAYER: 10,
  GHOST_TRAIL: 14,
  GHOST: 15,
  BOSS: 16,
  PROJECTILE: 17,
  STREAM: 20,
  LIGHT: 3,
  DUST: 12,
  FOG: 24,
  RAIN: 26,
  FOREGROUND: 30,
  FLASH: 34,
  VIGNETTE: 40,
}

// Parallax scenery (art/scenery.js). Factors scale the camera's scroll: 0
// stays put, 1 moves with the room, above 1 passes in front of it. WIDTH is
// the period a layer repeats at; HEIGHT the strip's height.
export const SCENERY = {
  FAR: { FACTOR_X: 0.2, FACTOR_Y: 0.2, WIDTH: 512, HEIGHT: 256 },
  MID: { FACTOR_X: 0.5, FACTOR_Y: 0.5, WIDTH: 512, HEIGHT: 256 },
  SKYLINE: { FACTOR_X: 0.1, FACTOR_Y: 0.05, WIDTH: 512, HEIGHT: 150 },
  STREET: { FACTOR_X: 0.35, FACTOR_Y: 0.2, WIDTH: 512, HEIGHT: 150 },
  FORE_BOTTOM: { FACTOR_X: 1.4, FACTOR_Y: 1.25, WIDTH: 640, HEIGHT: 72 },
  FORE_TOP: { FACTOR_X: 1.4, FACTOR_Y: 1.25, WIDTH: 640, HEIGHT: 56 },
  // Seed for the procedural layers, so every visit looks the same.
  SEED: 1984,
}

// Lighting and atmosphere (systems/Atmosphere.js, entities/Lamp.js).
export const ATMOSPHERE = {
  VIGNETTE_ALPHA: 0.62,
  // Inner radius of the vignette's clear centre, as a fraction of the half-diagonal.
  VIGNETTE_INNER: 0.45,
  // Two fog banks: one behind the room, one drifting the other way in front.
  FOG_BACK_ALPHA: 0.28,
  FOG_BACK_FACTOR: 0.8,
  FOG_ALPHA: 0.2,
  FOG_FRONT_FACTOR: 1.1,
  FOG_HEIGHT: 64,
  FOG_PERIOD: 256,
  FOG_DRIFT_SPEED: 6,
  // Floating dust: motes per 1000 px² of room, capped.
  DUST_DENSITY: 0.1,
  DUST_MIN: 16,
  DUST_MAX: 60,
  DUST_LIFETIME: 7,
  DUST_ALPHA: 0.55,
  DUST_DRIFT: 6,
  DUST_MIN_SCALE: 0.5,
  DUST_RISE: 7,
  // Dust kicked up by the player's feet.
  PUFF_MIN_LANDING_SPEED: 220,
  PUFF_COUNT: 5,
  PUFF_LIFETIME: 0.4,
  PUFF_SPEED: 40,
  PUFF_ALPHA: 0.7,
  PUFF_END_SCALE: 0.4,
  // Hanging lamps: at most one per this many tiles of ceiling, only above
  // open space this tall, at most MAX per room.
  LAMP_SPACING: 12,
  LAMP_MIN_CLEARANCE: 6,
  LAMP_MAX: 5,
  LAMP_CHAIN_MIN: 1,
  LAMP_CHAIN_MAX: 3,
  LAMP_SWAY: 0.04,
  LAMP_SWAY_SPEED: 1.3,
  LIGHT_SCALE: 1.6,
  LIGHT_ALPHA: 0.32,
  LIGHT_FLICKER: 0.06,
  // Two out-of-step sines make the flicker irregular.
  LIGHT_FLICKER_SPEED_A: 9.1,
  LIGHT_FLICKER_SPEED_B: 3.7,
  // Neighbouring lamps sway out of step: phase offset per tile.
  LAMP_PHASE_PER_TILE: 0.7,
  CONE_ALPHA: 0.1,
  LIGHT_SIZE: 128,
}

// Rooftop storm (systems/stormTiming.js, systems/StormEffects.js).
export const STORM = {
  STRIKE_MIN_DELAY: 3.5,
  STRIKE_MAX_DELAY: 9,
  FIRST_STRIKE_DELAY: 1.5,
  // Flash: a bright peak, a dip, a second peak, then a fade.
  FLASH_PEAK: 0.3,
  FLASH_SECOND_PEAK: 0.2,
  FLASH_DIP_AT: 0.06,
  FLASH_SECOND_AT: 0.11,
  FLASH_TIME: 0.55,
  BOLT_SEGMENTS: 9,
  BOLT_JITTER: 14,
  BOLT_TIME: 0.22,
  BOLT_BRANCH_CHANCE: 0.35,
  // Bolts strike across the sky (clear of the screen edges) and end behind the skyline.
  BOLT_MARGIN: 40,
  BOLT_BOTTOM: 0.62,
  BOLT_WIDTH: 3,
  BOLT_HALO_ALPHA: 0.35,
  BOLT_BRANCH_ALPHA: 0.7,
  RAIN_INTERVAL: 0.018,
  RAIN_LIFETIME: 0.75,
  RAIN_SPEED_X: -90,
  RAIN_SPEED_Y: 380,
  RAIN_ALPHA: 0.35,
}

// White flashes on a boss while the stream bites: one short flash every
// INTERVAL seconds of continuous hits.
export const HIT_FLASH = {
  INTERVAL: 0.28,
  DURATION: 0.05,
  // A boss not hit for this long stops flashing at once.
  LINGER: 0.1,
}

// Combat. Damage is in HP points, times in seconds, distances in px.
export const PLAYER_COMBAT = {
  MAX_HP: 5,
  INVULNERABLE_TIME: 1.0,
  // Invulnerable sprite blinks this many times per second.
  INVULNERABLE_BLINK_RATE: 12,
  INVULNERABLE_BLINK_ALPHA: 0.25,
  KNOCKBACK_SPEED_X: 160,
  KNOCKBACK_SPEED_Y: 220,
  KNOCKBACK_TIME: 0.18,
  // Run speed is multiplied by this while the proton stream is firing.
  FIRING_MOVE_MULTIPLIER: 0.45,
  DEATH_RESPAWN_DELAY: 1.2,
  DEATH_FADE_TIME: 0.4,
}

export const HIT_STOP = {
  PLAYER_HIT: 0.06,
  CAPTURE: 0.08,
  BOSS_CAPTURE: 0.14,
}

export const SCREEN_SHAKE = {
  PLAYER_HIT_TIME: 0.12,
  PLAYER_HIT_INTENSITY: 0.008,
  CAPTURE_TIME: 0.15,
  CAPTURE_INTENSITY: 0.006,
  STOMP_TIME: 0.25,
  STOMP_INTENSITY: 0.012,
  CRUMBLE_TIME: 0.12,
  CRUMBLE_INTENSITY: 0.005,
  BOSS_DEFEAT_TIME: 0.6,
  BOSS_DEFEAT_INTENSITY: 0.01,
}

export const PROTON_STREAM = {
  RANGE: 150,
  // Once tethered, the stream holds a ghost up to this far away.
  TETHER_RANGE: 190,
  // Ghosts are acquired inside this half-angle around the facing direction (degrees).
  AIM_HALF_ANGLE: 35,
  DAMAGE_PER_SECOND: 55,
  // Nozzle position relative to the player's feet, facing right.
  NOZZLE_OFFSET_X: 7,
  NOZZLE_OFFSET_Y: -13,
  // Spacing of line-of-sight samples along the stream.
  SAMPLE_STEP: 4,
  // Visual: number of segments, wobble amplitude (px) and speed (rad/s).
  SEGMENTS: 14,
  WOBBLE_AMPLITUDE: 3,
  WOBBLE_SPEED: 28,
  WOBBLE_WAVES: 2.5,
  // A second, faster sine on top of the first keeps the wobble irregular.
  HARMONIC_GAIN: 0.5,
  HARMONIC_RATIO: 2.3,
  HARMONIC_PHASE: 1.7,
  CORE_WIDTH: 1,
  INNER_WIDTH: 2,
  INNER_ALPHA: 0.8,
  GLOW_WIDTH: 4,
  GLOW_ALPHA: 0.45,
  NOZZLE_GLOW_SCALE: 0.6,
  NOZZLE_GLOW_ALPHA: 0.8,
  // Ring drawn around a tethered ghost.
  GRIP_RADIUS: 11,
  GRIP_ALPHA: 0.7,
  GRIP_PULSE_SPEED: 14,
  SPARKS_PER_SECOND: 40,
  SPARK_SPEED_MIN: 28,
  SPARK_SPEED_MAX: 70,
  SPARK_LIFETIME: 0.22,
}

export const GHOST = {
  MAX_HP: 100,
  // At or below this fraction of MAX_HP the ghost is weakened and can be trapped.
  WEAKEN_FRACTION: 0.35,
  // A ghost not hit for RECOVER_DELAY regains HP at RECOVER_RATE per second.
  RECOVER_DELAY: 2.0,
  RECOVER_RATE: 20,
  CONTACT_DAMAGE: 1,
  BODY_RADIUS: 8,

  HOVER_SPEED: 30,
  CHASE_SPEED: 55,
  STEER_RATE: 4,
  // Starts chasing within AGGRO_RANGE of the player; gives up beyond LEASH from home.
  AGGRO_RANGE: 130,
  LEASH_RANGE: 200,
  // Idle drift around home: radius and angular speed.
  WANDER_RADIUS: 24,
  WANDER_SPEED: 0.9,
  BOB_AMPLITUDE: 2,
  BOB_SPEED: 3,
  // Tethered ghosts struggle away from the player at this speed.
  STRUGGLE_SPEED: 30,
  WEAKENED_SPEED_MULTIPLIER: 0.4,
  // Weakened ghosts sag toward the floor at this speed.
  WEAKENED_SINK_SPEED: 14,
  // Ghost centres never drift closer than this to the floor beneath them.
  MIN_HOVER_HEIGHT: 16,
  // A ghost that touched the player backs off for this long.
  RECOIL_TIME: 0.6,
  RECOIL_SPEED: 90,
  // Weakened ghosts flicker their alpha at this rate (Hz).
  WEAKENED_FLICKER_RATE: 8,
  WEAKENED_FLICKER_ALPHA: 0.55,
  TRAIL_INTERVAL: 0.06,
  TRAIL_LIFETIME: 0.45,
  TRAIL_ALPHA: 0.22,
  GLOW_SCALE: 1.6,
  GLOW_ALPHA: 0.35,
  GLOW_PULSE_SPEED: 4,
  GLOW_PULSE_AMOUNT: 0.12,
  // A ghost being hit by the stream shivers by up to this many px.
  HIT_JITTER: 1,
  HIT_JITTER_TIME: 0.05,
  // While captured the ghost shrinks to this scale as it is pulled in.
  CAPTURE_END_SCALE: 0.15,
}

// Slimer: flees through the hotel, then fights like a tougher, faster ghost
// when cornered. Shares the ghost rules (systems/ghostState.js, ghostSteering.js).
export const SLIMER = {
  ...GHOST,
  MAX_HP: 180,
  WEAKEN_FRACTION: 0.3,
  RECOVER_DELAY: 1.5,
  RECOVER_RATE: 35,
  BODY_RADIUS: 10,
  HOVER_SPEED: 45,
  CHASE_SPEED: 72,
  AGGRO_RANGE: 220,
  LEASH_RANGE: 420,
  WANDER_RADIUS: 70,
  STRUGGLE_SPEED: 48,
  GLOW_SCALE: 2,
  // The chase: he flees to his next waypoint when the player comes within
  // FLEE_RANGE, at FLEE_SPEED, and counts as arrived within ARRIVE_DISTANCE.
  FLEE_RANGE: 100,
  FLEE_SPEED: 125,
  ARRIVE_DISTANCE: 3,
}

// The Librarian, mini-boss of the Archive Vault. HP and recovery work like a
// ghost's (systems/ghostState.js); her attacks are in systems/librarianBrain.js.
export const LIBRARIAN = {
  MAX_HP: 300,
  WEAKEN_FRACTION: 0.25,
  RECOVER_DELAY: 2.5,
  RECOVER_RATE: 45,
  BODY_RADIUS: 12,
  CONTACT_DAMAGE: 1,
  WAKE_TIME: 1.4,
  DRIFT_TIME: 1.6,
  DRIFT_SPEED: 70,
  STEER_RATE: 3,
  // After recovering from a stun she is angry: faster, shorter pauses.
  ANGRY_MULTIPLIER: 1.35,
  VOLLEY_BOOKS: 3,
  VOLLEY_INTERVAL: 0.3,
  BOOK_SPEED: 140,
  SWOOP_WINDUP: 0.6,
  SWOOP_SPEED: 230,
  SWOOP_TIME: 0.75,
  // Held by the stream she drifts at this fraction of her speed.
  TETHERED_SPEED_MULTIPLIER: 0.5,
  // Stunned (weakened) she sinks toward the floor.
  STUN_SINK_SPEED: 22,
  MIN_HOVER_HEIGHT: 20,
  GLOW_SCALE: 2.4,
  GLOW_ALPHA: 0.35,
  BOB_AMPLITUDE: 2,
  BOB_SPEED: 2.4,
  WINDUP_JITTER: 1,
  STUN_FLICKER_RATE: 8,
  STUN_FLICKER_ALPHA: 0.55,
  CAPTURE_END_SCALE: 0.15,
}

// The marshmallow mascot, final boss. Three rounds of weaken-and-trap; each
// trap tears a chunk of spirit out of him and he comes back angrier.
export const MALLOW = {
  MAX_HP: 260,
  WEAKEN_FRACTION: 0.3,
  RECOVER_DELAY: 2.2,
  RECOVER_RATE: 50,
  PHASES: 3,
  CONTACT_DAMAGE: 1,
  // Contact box around his feet position.
  BODY_WIDTH: 30,
  BODY_HEIGHT: 50,
  // Where the stream and trap aim (his head), above his feet.
  CORE_HEIGHT: 40,
  KNEEL_CORE_HEIGHT: 22,
  WAKE_TIME: 1.8,
  WALK_SPEED: 30,
  WALK_TIME: 1.8,
  // Each phase after the first is this much faster.
  PHASE_SPEED_STEP: 0.25,
  STOMP_WINDUP: 0.5,
  STOMP_JUMP_VELOCITY: 360,
  STOMP_GRAVITY: 900,
  STOMP_MAX_SPEED_X: 120,
  STOMP_RECOVER_TIME: 0.6,
  THROW_COUNT: 3,
  THROW_INTERVAL: 0.4,
  // Globs are lobbed so they land near the player after this long.
  THROW_FLIGHT_TIME: 0.9,
  ROAR_TIME: 1.4,
  // Squash while crouching or landing, and kneeling height when weakened.
  CROUCH_SCALE_Y: 0.85,
  KNEEL_SCALE_Y: 0.72,
  // Squash on landing a stomp and stretch on take-off, easing back at RECOVERY_RATE.
  LAND_SQUASH_Y: 0.7,
  LEAP_STRETCH_Y: 1.18,
  SQUASH_RECOVERY_RATE: 10,
  WALK_BOB_AMPLITUDE: 2,
  WALK_BOB_SPEED: 7,
  GLOW_SCALE: 3.4,
  GLOW_ALPHA: 0.22,
  CAPTURE_SHRINK: 0.12,
  DEFEAT_TIME: 1.6,
  DEFEAT_PUFFS: 40,
}

export const PROJECTILE = {
  DAMAGE: 1,
  BOOK_RADIUS: 4,
  BOOK_LIFETIME: 3,
  GLOB_SIZE: 7,
  GLOB_RADIUS: 4,
  GLOB_GRAVITY: 600,
  GLOB_LIFETIME: 4,
  // Shockwaves run along the floor from a stomp.
  SHOCKWAVE_SPEED: 150,
  SHOCKWAVE_RADIUS: 6,
  SHOCKWAVE_HEIGHT: 6,
  SHOCKWAVE_LIFETIME: 2.4,
  GLOW_SCALE: 0.7,
  GLOW_ALPHA: 0.5,
}

// A boss fight: the room's exits are sealed while it lasts.
export const BOSS_FIGHT = {
  SEAL_ALPHA: 0.55,
  SEAL_FLICKER_SPEED: 9,
  // The boss bar's health is published in steps of 1 / BAR_STEPS.
  BAR_STEPS: 50,
}

// Ability relics and shop goods.
export const RELIC = {
  BOB_AMPLITUDE: 3,
  BOB_SPEED: 2.5,
  PICKUP_RADIUS: 14,
  // It hangs in the air this long before it can be picked up, so it's seen.
  PICKUP_DELAY: 0.8,
  GLOW_SCALE: 1.8,
  GLOW_ALPHA: 0.6,
  // Height above the floor it floats at.
  HOVER_HEIGHT: 18,
}

export const SHOP = {
  // The player can buy within this many px of the desk spot, horizontally.
  REACH: 18,
  BOOTS_PRICE: 12,
  BATTERY_CELL_PRICE: 20,
  // Goods float above the desk at this height (px above the floor).
  DISPLAY_HEIGHT: 40,
  GLOW_ALPHA: 0.35,
  GLOW_SCALE: 1.5,
  FLASH_TIME: 0.12,
}

// Visuals of gates.
export const GATES = {
  SPECTRAL_ALPHA: 0.16,
  SPECTRAL_FLICKER_SPEED: 3,
  SPECTRAL_FLICKER_AMOUNT: 0.4,
  BARRIER_GLOW_ALPHA: 0.25,
  BARRIER_PULSE_SPEED: 3,
  BARRIER_PULSE_AMOUNT: 0.3,
  CRACK_ALPHA: 0.9,
  CRUMBLE_PARTICLES: 10,
  CRUMBLE_SPEED: 60,
  CRUMBLE_LIFETIME: 0.5,
  // Afterimages while dashing.
  DASH_TRAIL_INTERVAL: 0.03,
  DASH_TRAIL_LIFETIME: 0.18,
  DASH_TRAIL_ALPHA: 0.45,
}

export const TRAP = {
  THROW_SPEED_Y: 230,
  // Horizontal throw speed when there is no tethered ghost to aim at.
  THROW_SPEED_X: 110,
  MAX_THROW_SPEED_X: 220,
  GRAVITY: 900,
  BODY_WIDTH: 10,
  BODY_HEIGHT: 6,
  GROUND_FRICTION: 900,
  // Capture cone above an armed trap.
  CAPTURE_HALF_WIDTH: 22,
  CAPTURE_HEIGHT: 90,
  CAPTURE_TIME: 0.7,
  // An armed trap that catches nothing closes after this long.
  ARMED_TIME: 3.0,
  // A closed trap stays on the floor this long, then returns to the player.
  CLOSED_TIME: 0.6,
  COOLDOWN: 0.3,
  // Max time in the air before the throw is treated as landed.
  MAX_FLIGHT_TIME: 2.0,
  // Thrown from this offset above the player's feet.
  THROW_HEIGHT: 12,
  // Capture beam visuals.
  BEAM_ALPHA: 0.35,
  BEAM_FLICKER_SPEED: 40,
  BEAM_FLICKER_AMOUNT: 0.15,
  BEAM_BASE_HALF_WIDTH: 4,
  GLOW_SCALE: 1.4,
  GLOW_ALPHA: 0.6,
}

export const ESSENCE = {
  DROP_COUNT: 3,
  // Every HEAL_COST essence collected restores one HP (when hurt).
  HEAL_COST: 3,
  ORB_SPEED_MIN: 100,
  ORB_SPEED_MAX: 170,
  ORB_GRAVITY: 600,
  ORB_BOUNCE: 0.45,
  ORB_DRAG: 60,
  // Orbs ignore the player briefly after spawning, then home in.
  ORB_PICKUP_DELAY: 0.4,
  ORB_MAGNET_RANGE: 48,
  ORB_MAGNET_SPEED: 220,
  ORB_PICKUP_RADIUS: 10,
  ORB_SIZE: 5,
  // Orbs launch upward inside this spread around straight up (degrees).
  ORB_SPREAD: 50,
  // Below this bounce speed an orb settles on the floor.
  ORB_REST_SPEED: 30,
  ORB_GLOW_SCALE: 0.55,
  ORB_GLOW_ALPHA: 0.7,
  ORB_TWINKLE_SPEED: 9,
  ORB_TWINKLE_AMOUNT: 0.25,
}

export const HUD = {
  MARGIN_X: 10,
  MARGIN_Y: 9,
  PIP_SPACING: 2,
  ESSENCE_GAP: 6,
  DIGIT_SPACING: 2,
  DIGIT_SCALE: 2,
  // Pip shake when the player is hit.
  HIT_FLASH_TIME: 0.25,
  // Row of owned-ability relics under the essence counter.
  ABILITY_ROW_GAP: 14,
  ABILITY_SPACING: 13,
  ABILITY_SCALE: 0.75,
  // Ornamental plate behind the HUD.
  PLATE_PADDING_X: 6,
  PLATE_PADDING_Y: 4,
  PLATE_ALPHA: 0.5,
}

// Walking from one room into the next.
export const ROOM_TRANSITION = {
  // Fade out, then in, in seconds.
  FADE_TIME: 0.18,
  // The player appears this many px inside the new room's edge.
  ENTRY_INSET: 2,
  // Coming up through a floor, the player rises at least this fast (px/s),
  // enough to clear the two-tile floor beside the opening.
  ENTRY_JUMP_VELOCITY: 400,
}

// The fire pole: the save point.
export const FIRE_POLE = {
  // The player can rest within this many px of the pole, horizontally.
  REACH: 14,
  WIDTH: 4,
  GLOW_SCALE: 1.1,
  GLOW_ALPHA: 0.18,
  // Flash when the player rests.
  SAVE_GLOW_SCALE: 2.2,
  SAVE_GLOW_ALPHA: 0.85,
  SAVE_GLOW_TIME: 0.7,
}

// Player settings (systems/settings.js). Volumes and opacity run 0..1.
export const SETTINGS = {
  DEFAULT_VOLUME: 0.8,
  DEFAULT_MUSIC: 0.5,
  VOLUME_STEP: 0.1,
  DEFAULT_TOUCH_OPACITY: 1,
  TOUCH_OPACITY_MIN: 0.2,
  TOUCH_OPACITY_STEP: 0.1,
}

// Web Audio mixing (systems/AudioEngine.js, systems/soundRecipes.js). Gains
// are linear, times in seconds.
export const AUDIO = {
  // Headroom under the master volume, ahead of the compressor.
  MASTER_GAIN: 0.7,
  SFX_GAIN: 1,
  MUSIC_GAIN: 0.32,
  // The music drops to this fraction while the game is paused.
  PAUSE_DUCK: 0.45,
  // Volume changes glide with this time constant, so sliders don't click.
  RAMP_TIME: 0.04,
  // Sound effects playing at once; extra ones are dropped.
  MAX_VOICES: 28,
  // The same effect plays at most this often.
  MIN_GAP: 0.05,
  // Every effect's pitch is varied by up to ± this fraction.
  PITCH_JITTER: 0.04,
  // Length of the shared white-noise buffer.
  NOISE_SECONDS: 1,
  // Gains never ramp to exactly zero (exponential ramps can't reach it).
  SILENCE: 0.0001,

  // The proton stream's hum while fire is held.
  HUM_BASE: 68,
  HUM_GAIN: 0.13,
  HUM_ATTACK: 0.05,
  HUM_RELEASE: 0.12,
  HUM_CUTOFF: 900,
  HUM_WOBBLE_RATE: 7,
  HUM_WOBBLE_DEPTH: 260,
  HUM_CRACKLE_GAIN: 0.045,
  HUM_CRACKLE_FREQ: 3200,
  // Locked onto a ghost, the hum rises and opens up.
  HUM_TETHER_PITCH: 1.18,
  HUM_TETHER_CUTOFF: 1.6,

  // Thunder follows the flash after a delay; the longer it is, the farther
  // and quieter the strike.
  THUNDER_DELAY_MIN: 0.2,
  THUNDER_DELAY_MAX: 1.4,
  THUNDER_GAIN_NEAR: 0.55,
  THUNDER_GAIN_FAR: 0.25,

  // Landings softer than this (px/s) make no sound.
  LAND_MIN_SPEED: 140,

  // Ambient music: pads cross-fade over this long.
  AMBIENT_FADE: 1.6,
}

// The title screen's slow pan across the skyline.
export const TITLE = {
  PAN_SPEED: 10,
  // The ghost's height and starting point, as fractions of the screen.
  GHOST_Y: 0.42,
  GHOST_START_X: 0.7,
  GHOST_SPEED: 16,
  GHOST_BOB: 6,
  GHOST_BOB_SPEED: 1.6,
  GHOST_ALPHA: 0.85,
  GHOST_GLOW_SCALE: 2.4,
  GHOST_GLOW_ALPHA: 0.35,
}

// After the mascot falls: a beat to watch him burst, then the ending.
export const ENDING = {
  DELAY: 3.2,
  FADE_TIME: 1.2,
  PAN_SPEED: 6,
  // Marshmallow puffs drifting down over the city.
  PUFF_INTERVAL: 0.12,
  PUFF_LIFETIME: 9,
  PUFF_SPEED_Y: 18,
  PUFF_SWAY: 10,
  PUFF_SCALE_MIN: 0.3,
  PUFF_SCALE_MAX: 0.7,
  PUFF_ALPHA: 0.8,
  PUFF_SPAWN_ABOVE: 8,
  // The sunrise glow: centre height and size as fractions of the screen.
  DAWN_Y: 0.95,
  DAWN_WIDTH: 1.4,
  DAWN_HEIGHT: 1.1,
  DAWN_ALPHA: 0.55,
}
