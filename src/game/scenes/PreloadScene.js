import Phaser from 'phaser'
import { generateTextures } from '../art/generateTextures.js'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    generateTextures(this)
    this.scene.start('World')
  }
}
