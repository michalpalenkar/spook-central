import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants.js'
import { PALETTE } from './art/palette.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { WorldScene } from './scenes/WorldScene.js'

// The canvas renders at the fixed internal resolution and is upscaled with
// nearest-neighbour filtering, so the device pixel ratio never changes the
// render cost.
//
// `touchInput` is the TouchInput the React touch overlay writes to; it is put
// in the game registry so scenes can add it as an InputState source.
export function createGameConfig(parent, { touchInput } = {}) {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.void,
    pixelArt: true,
    roundPixels: true,
    banner: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      // Gravity is applied by systems/movement.js so it can be unit-tested.
      arcade: { gravity: { x: 0, y: 0 } },
    },
    callbacks: {
      preBoot: (game) => game.registry.set('touchInput', touchInput),
    },
    scene: [PreloadScene, WorldScene],
  }
}
