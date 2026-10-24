import Phaser from 'phaser'
import { GAME_HEIGHT, GAME_WIDTH } from './constants.js'
import { PALETTE } from './art/palette.js'
import { EndingScene } from './scenes/EndingScene.js'
import { MenuScene } from './scenes/MenuScene.js'
import { PreloadScene } from './scenes/PreloadScene.js'
import { TitleScene } from './scenes/TitleScene.js'
import { UIScene } from './scenes/UIScene.js'
import { WorldScene } from './scenes/WorldScene.js'

// The canvas renders at the fixed internal resolution and is upscaled with
// nearest-neighbour filtering, so the device pixel ratio never changes the
// render cost.
//
// `touchInput` is the TouchInput the React touch overlay writes to; it is put
// in the game registry so scenes can add it as an InputState source.
// `bridge` is the GameBridge the React overlays (map, hints, toasts, menus)
// read. `audio` is the AudioEngine (systems/AudioEngine.js); Phaser's own
// sound manager is off, so it never opens an AudioContext of its own.
export function createGameConfig(parent, { touchInput, bridge, audio } = {}) {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: PALETTE.void,
    pixelArt: true,
    roundPixels: true,
    banner: false,
    audio: { noAudio: true },
    // Only the keyboard goes through Phaser: touch is an HTML overlay and
    // gamepads are polled directly, so pointer and pad handling stay off.
    input: { keyboard: true, mouse: false, touch: false, gamepad: false },
    disableContextMenu: true,
    render: { powerPreference: 'high-performance' },
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
      preBoot: (game) => {
        game.registry.set('touchInput', touchInput)
        game.registry.set('bridge', bridge)
        game.registry.set('audio', audio)
      },
    },
    // Drawn in this order; Menu draws nothing and runs the flow.
    scene: [PreloadScene, TitleScene, WorldScene, UIScene, EndingScene, MenuScene],
  }
}

/** Starts the game. Lives here so Phaser loads in its own chunk (see Game.jsx). */
export function createGame(parent, deps) {
  return new Phaser.Game(createGameConfig(parent, deps))
}
