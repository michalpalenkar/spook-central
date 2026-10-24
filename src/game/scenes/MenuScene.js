import Phaser from 'phaser'
import { WORLD_INFO } from '../levels/world.js'
import { GamepadInput } from '../systems/GamepadInput.js'
import { canVibrate } from '../systems/haptics.js'
import { InputState } from '../systems/InputState.js'
import { KeyboardInput } from '../systems/KeyboardInput.js'
import {
  INTENT,
  MENU,
  MENU_ACTION,
  MENU_SOUND,
  activateItem,
  adjustItem,
  applyIntent,
  createMenu,
  focusItem,
  menuIntents,
  menuView,
} from '../systems/menuModel.js'
import { clearSave, loadSave } from '../systems/saveStorage.js'
import { ENTRY, newSession, sessionFromSave } from '../systems/session.js'
import { saveSettings } from '../systems/settings.js'
import { SOUND } from '../systems/soundRecipes.js'

export const SAVE_LOAD_ERROR_TEXT = 'Save couldn’t be loaded · a new game will start fresh'
export const SETTINGS_SAVE_FAILED_TEXT = 'Settings couldn’t be saved on this device'

const MENU_SOUNDS = {
  [MENU_SOUND.MOVE]: SOUND.UI_MOVE,
  [MENU_SOUND.SELECT]: SOUND.UI_SELECT,
  [MENU_SOUND.BACK]: SOUND.UI_BACK,
  [MENU_SOUND.ADJUST]: SOUND.UI_MOVE,
}

// Bridge state cleared whenever play stops (quit, ending).
const CLEAR_PLAY = { hint: null, toast: null, banner: null, area: null, boss: null, mapOpen: false, map: null }

/**
 * Runs the game's flow and menus. It never draws: it starts and stops the
 * Title, World, UI and Ending scenes, keeps the menu state
 * (systems/menuModel.js) and publishes it to the HTML menus through the
 * bridge. It also owns the input: the keyboard is bound here, because this
 * scene is the one that never stops, and the shared InputState is updated
 * once per frame before any scene reads it.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu')
  }

  create() {
    this.bridge = this.registry.get('bridge')
    this.audio = this.registry.get('audio') ?? null
    this.menu = null
    this.openedFrame = -1
    this.hasSave = false

    const input = new InputState()
    input.addSource(new KeyboardInput(this.input.keyboard))
    input.addSource(new GamepadInput())
    const touchInput = this.registry.get('touchInput')
    if (touchInput) input.addSource(touchInput)
    this.inputState = input
    this.registry.set('inputState', input)
    const poll = () => input.update()
    this.game.events.on(Phaser.Core.Events.PRE_STEP, poll)

    const stopListening = this.bridge?.onCommand((command) => this.onCommand(command))
    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.PRE_STEP, poll)
      stopListening?.()
    })

    // Dev only: `?room=<id>` skips the title and starts at that room.
    const devRoom = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('room') : null
    if (devRoom) {
      const { save } = loadSave(WORLD_INFO)
      const session = save ? sessionFromSave(save) : newSession(WORLD_INFO)
      session.roomId = devRoom
      session.entry = { type: ENTRY.SPAWN }
      this.startGame(session)
    } else {
      this.showTitle()
    }
  }

  get screen() {
    return this.bridge?.getState().screen
  }

  context() {
    return { hasSave: this.hasSave, settings: this.bridge.getState().settings, canVibrate: canVibrate() }
  }

  update() {
    // The frame a menu opens, the press that opened it is already used.
    if (!this.menu || this.inputState.frame === this.openedFrame) return
    for (const intent of menuIntents(this.inputState)) {
      if (!this.menu) break
      this.apply(applyIntent(this.menu, intent, this.context()))
    }
  }

  onCommand(command) {
    if (command.type === 'pause') {
      this.openPause()
      return
    }
    if (!this.menu) return
    const ctx = this.context()
    switch (command.type) {
      case 'menu-focus':
        this.setMenu(focusItem(this.menu, command.index, ctx))
        break
      case 'menu-activate':
        this.apply(activateItem(this.menu, command.index, ctx))
        break
      case 'menu-adjust':
        this.apply(adjustItem(this.menu, command.index, command.direction, ctx))
        break
      case 'menu-back':
        this.apply(applyIntent(this.menu, INTENT.BACK, ctx))
        break
    }
  }

  apply({ menu, effect, sound }) {
    if (sound) this.audio?.play(MENU_SOUNDS[sound])
    this.setMenu(menu)
    if (effect?.type === 'settings') this.changeSettings(effect.settings)
    if (effect?.type === 'action') this.runAction(effect.id)
  }

  setMenu(menu) {
    const wasMap = this.menu?.screen === MENU.MAP
    this.menu = menu
    if (!menu) {
      this.bridge.update({ menu: null, mapOpen: false })
      return
    }
    const isMap = menu.screen === MENU.MAP
    const update = { menu: menuView(menu, this.context()), mapOpen: isMap }
    if (isMap && !wasMap) update.map = this.scene.get('World').mapView()
    this.bridge.update(update)
  }

  changeSettings(settings) {
    this.bridge.update({ settings })
    if (!saveSettings(settings).ok) this.bridge.toast(SETTINGS_SAVE_FAILED_TEXT)
    this.setMenu(this.menu)
  }

  runAction(id) {
    switch (id) {
      case MENU_ACTION.CONTINUE: {
        const { save } = loadSave(WORLD_INFO)
        if (save) this.startGame(sessionFromSave(save))
        else this.showTitle()
        break
      }
      case MENU_ACTION.NEW_GAME:
        clearSave()
        this.startGame(newSession(WORLD_INFO))
        break
      case MENU_ACTION.RESUME:
        this.resume()
        break
      case MENU_ACTION.QUIT:
      case MENU_ACTION.TO_TITLE:
        this.showTitle()
        break
    }
  }

  openMenu(screen) {
    this.openedFrame = this.inputState.frame
    this.setMenu(createMenu(screen, this.context()))
  }

  // Stops whichever of the play scenes are running.
  stopScenes(keys) {
    for (const key of keys) {
      if (this.scene.isActive(key) || this.scene.isPaused(key) || this.scene.isSleeping(key)) this.scene.stop(key)
    }
  }

  showTitle() {
    this.stopScenes(['World', 'UI', 'Ending'])
    this.audio?.setHum(false)
    this.audio?.setPaused(false)
    this.audio?.setAmbient('title')
    const { save, error } = loadSave(WORLD_INFO)
    this.hasSave = Boolean(save)
    this.bridge.update({ ...CLEAR_PLAY, screen: 'title', ending: null })
    if (error === 'corrupt' || error === 'invalid') this.bridge.toast(SAVE_LOAD_ERROR_TEXT)
    if (!this.scene.isActive('Title')) this.scene.launch('Title')
    this.openMenu(MENU.TITLE)
  }

  startGame(session) {
    this.registry.set('session', session)
    this.stopScenes(['Title', 'Ending', 'World', 'UI'])
    this.audio?.setPaused(false)
    this.setMenu(null)
    this.bridge.update({ ...CLEAR_PLAY, screen: 'playing', ending: null })
    this.scene.launch('World')
  }

  /** Pauses play and opens the pause menu (does nothing outside play). */
  openPause() {
    if (this.screen !== 'playing' || !this.scene.isActive('World')) return
    this.scene.pause('World')
    this.audio?.setPaused(true)
    this.audio?.play(SOUND.UI_OPEN)
    this.bridge.update({ screen: 'paused', hint: null })
    this.openMenu(MENU.PAUSE)
  }

  resume() {
    this.setMenu(null)
    this.bridge.update({ screen: 'playing' })
    this.audio?.setPaused(false)
    this.scene.resume('World')
  }

  /** After the final boss: the ending screen with the run's `stats`. */
  showEnding(stats) {
    this.stopScenes(['World', 'UI'])
    this.audio?.setHum(false)
    this.audio?.setAmbient('ending')
    this.bridge.update({ ...CLEAR_PLAY, screen: 'ending', ending: stats })
    this.scene.launch('Ending')
    this.openMenu(MENU.ENDING)
  }
}
