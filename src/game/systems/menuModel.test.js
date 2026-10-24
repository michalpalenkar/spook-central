import { describe, expect, it } from 'vitest'
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
} from './menuModel.js'
import { DEFAULT_SETTINGS } from './settings.js'

const ctx = (extra = {}) => ({ hasSave: true, settings: { ...DEFAULT_SETTINGS }, canVibrate: true, ...extra })

// Applies intents in order, returning the final menu and every effect.
function run(menu, intents, context = ctx()) {
  const effects = []
  for (const intent of intents) {
    const out = applyIntent(menu, intent, context)
    menu = out.menu
    if (out.effect) effects.push(out.effect)
  }
  return { menu, effects }
}

const action = (id) => ({ type: 'action', id })

describe('title menu', () => {
  it('starts on Continue when there is a save', () => {
    const menu = createMenu(MENU.TITLE, ctx())
    expect(menu.cursor).toBe(0)
    expect(run(menu, [INTENT.CONFIRM]).effects).toEqual([action(MENU_ACTION.CONTINUE)])
  })

  it('skips the disabled Continue without a save', () => {
    const context = ctx({ hasSave: false })
    const menu = createMenu(MENU.TITLE, context)
    expect(menu.cursor).toBe(1)
    // Up wraps past the disabled item to Settings.
    expect(run(menu, [INTENT.UP], context).menu.cursor).toBe(2)
    expect(run(menu, [INTENT.CONFIRM], context).effects).toEqual([action(MENU_ACTION.NEW_GAME)])
    expect(activateItem(menu, 0, context).effect).toBeNull()
  })

  it('asks before a new game overwrites the save', () => {
    const menu = createMenu(MENU.TITLE, ctx())
    const asked = run(menu, [INTENT.DOWN, INTENT.CONFIRM])
    expect(asked.menu.screen).toBe(MENU.CONFIRM_NEW)
    expect(asked.effects).toEqual([])
    expect(run(asked.menu, [INTENT.CONFIRM]).effects).toEqual([action(MENU_ACTION.NEW_GAME)])
    // Keeping the save goes back to the title, cursor where it was.
    const kept = run(asked.menu, [INTENT.DOWN, INTENT.CONFIRM]).menu
    expect(kept).toEqual({ screen: MENU.TITLE, cursor: 1, stack: [] })
    expect(run(asked.menu, [INTENT.BACK]).menu.screen).toBe(MENU.TITLE)
  })

  it('ignores back on the title', () => {
    const menu = createMenu(MENU.TITLE, ctx())
    expect(applyIntent(menu, INTENT.BACK, ctx())).toEqual({ menu, effect: null, sound: null })
  })
})

describe('pause menu', () => {
  it('resumes, quits, and resumes on back', () => {
    const menu = createMenu(MENU.PAUSE, ctx())
    expect(run(menu, [INTENT.CONFIRM]).effects).toEqual([action(MENU_ACTION.RESUME)])
    expect(run(menu, [INTENT.BACK]).effects).toEqual([action(MENU_ACTION.RESUME)])
    expect(run(menu, [INTENT.UP, INTENT.CONFIRM]).effects).toEqual([action(MENU_ACTION.QUIT)])
  })

  it('opens the map, which any confirm or back closes', () => {
    const menu = createMenu(MENU.PAUSE, ctx())
    const map = run(menu, [INTENT.DOWN, INTENT.CONFIRM]).menu
    expect(map.screen).toBe(MENU.MAP)
    expect(run(map, [INTENT.UP, INTENT.LEFT]).menu).toEqual(map)
    expect(run(map, [INTENT.BACK]).menu).toEqual({ screen: MENU.PAUSE, cursor: 1, stack: [] })
    expect(run(map, [INTENT.CONFIRM]).menu.screen).toBe(MENU.PAUSE)
  })
})

describe('settings menu', () => {
  const open = () => run(createMenu(MENU.PAUSE, ctx()), [INTENT.DOWN, INTENT.DOWN, INTENT.CONFIRM]).menu

  it('adjusts sliders with left and right', () => {
    const menu = open()
    expect(menu.screen).toBe(MENU.SETTINGS)
    const out = applyIntent(menu, INTENT.LEFT, ctx())
    expect(out.effect).toEqual({ type: 'settings', settings: { ...DEFAULT_SETTINGS, volume: 0.7 } })
    expect(out.sound).toBe(MENU_SOUND.ADJUST)
    // Already at the top: nothing to do.
    const full = ctx({ settings: { ...DEFAULT_SETTINGS, volume: 1 } })
    expect(applyIntent(menu, INTENT.RIGHT, full).effect).toBeNull()
  })

  it('flips toggles with confirm or left/right', () => {
    const menu = { ...open(), cursor: 2 }
    expect(applyIntent(menu, INTENT.CONFIRM, ctx()).effect.settings.muted).toBe(true)
    expect(applyIntent(menu, INTENT.RIGHT, ctx()).effect.settings.muted).toBe(true)
  })

  it('disables vibration where the device has none', () => {
    const context = ctx({ canVibrate: false })
    const menu = { ...open(), cursor: 3 }
    expect(run(menu, [INTENT.DOWN], context).menu.cursor).toBe(5)
    const view = menuView(menu, context)
    expect(view.items[4]).toMatchObject({ id: 'haptics', disabled: true })
  })

  it('goes back with Back or the back intent', () => {
    const menu = open()
    expect(run(menu, [INTENT.BACK]).menu).toEqual({ screen: MENU.PAUSE, cursor: 2, stack: [] })
    expect(run(menu, [INTENT.UP, INTENT.CONFIRM]).menu.screen).toBe(MENU.PAUSE)
  })

  it('handles clicks on − and +', () => {
    const menu = open()
    expect(adjustItem(menu, 3, -1, ctx()).effect.settings.touchOpacity).toBe(0.9)
    expect(adjustItem(menu, 3, -1, ctx()).menu.cursor).toBe(3)
    expect(adjustItem(menu, 9, 1, ctx()).effect).toBeNull()
  })
})

describe('ending menu', () => {
  it('goes back to the title and ignores back', () => {
    const menu = createMenu(MENU.ENDING, ctx())
    expect(run(menu, [INTENT.CONFIRM]).effects).toEqual([action(MENU_ACTION.TO_TITLE)])
    expect(run(menu, [INTENT.BACK]).effects).toEqual([])
  })
})

describe('pointer helpers', () => {
  it('focuses enabled items only', () => {
    const context = ctx({ hasSave: false })
    const menu = createMenu(MENU.TITLE, context)
    expect(focusItem(menu, 2, context).cursor).toBe(2)
    expect(focusItem(menu, 0, context)).toBe(menu)
    expect(focusItem(menu, 7, context)).toBe(menu)
  })

  it('activates the clicked item', () => {
    const menu = createMenu(MENU.PAUSE, ctx())
    expect(activateItem(menu, 3, ctx()).effect).toEqual(action(MENU_ACTION.QUIT))
  })
})

describe('menuIntents', () => {
  const input = (...pressed) => ({ justPressed: (a) => pressed.includes(a) })

  it('maps input to intents', () => {
    expect(menuIntents(input('up'))).toEqual([INTENT.UP])
    expect(menuIntents(input('down', 'right'))).toEqual([INTENT.DOWN, INTENT.RIGHT])
    expect(menuIntents(input('jump'))).toEqual([INTENT.CONFIRM])
    expect(menuIntents(input('dash'))).toEqual([INTENT.BACK])
    expect(menuIntents(input('pause'))).toEqual([INTENT.BACK])
    expect(menuIntents(input('fire', 'trap'))).toEqual([])
  })
})

describe('menuView', () => {
  it('describes the screen for the HTML menu', () => {
    const view = menuView(createMenu(MENU.SETTINGS, ctx()), ctx())
    expect(view.title).toBe('Settings')
    expect(view.items[0]).toMatchObject({ id: 'volume', valueText: '80%', range: { min: 0, max: 1 } })
    expect(view.items[2]).toMatchObject({ id: 'muted', valueText: 'Off' })
    expect(view.nested).toBe(false)
  })
})
