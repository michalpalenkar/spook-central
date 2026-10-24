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
  POLE: -1,
  ROOM: 0,
  TRAP_BEAM: 4,
  TRAP: 5,
  ORB: 6,
  PLAYER: 10,
  GHOST_TRAIL: 14,
  GHOST: 15,
  STREAM: 20,
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
}

export const SCREEN_SHAKE = {
  PLAYER_HIT_TIME: 0.12,
  PLAYER_HIT_INTENSITY: 0.008,
  CAPTURE_TIME: 0.15,
  CAPTURE_INTENSITY: 0.006,
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
