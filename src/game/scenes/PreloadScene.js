import Phaser from 'phaser'
import { generateTextures } from '../art/generateTextures.js'
import { WORLD_INFO } from '../levels/world.js'
import { loadSave } from '../systems/saveStorage.js'
import { ENTRY, newSession, sessionFromSave } from '../systems/session.js'

export const SAVE_LOAD_ERROR_TEXT = 'Save couldn’t be loaded · new game started'

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }

  create() {
    generateTextures(this)
    this.registry.set('session', this.startSession())
    this.scene.start('World')
  }

  // Continues from the save if there is a usable one. (A title screen with
  // New game / Continue comes in milestone 7.)
  startSession() {
    const { save, error } = loadSave(WORLD_INFO)
    const session = save ? sessionFromSave(save) : newSession(WORLD_INFO)
    if (error === 'corrupt' || error === 'invalid') this.registry.get('bridge')?.toast(SAVE_LOAD_ERROR_TEXT)

    // Dev only: `?room=<id>` starts at that room's spawn (e.g. the test room).
    if (import.meta.env.DEV) {
      const room = new URLSearchParams(window.location.search).get('room')
      if (room) {
        session.roomId = room
        session.entry = { type: ENTRY.SPAWN }
      }
    }
    return session
  }
}
