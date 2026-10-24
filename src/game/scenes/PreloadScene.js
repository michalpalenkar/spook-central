import Phaser from 'phaser'
import { generateTextures } from '../art/generateTextures.js'

/** Draws every texture in code, then hands over to the Menu scene, which runs the game's flow. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    generateTextures(this)
    this.scene.start('Menu')
  }
}
