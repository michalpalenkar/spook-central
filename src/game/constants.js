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
