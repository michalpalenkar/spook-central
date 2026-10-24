import { SETTING_RANGES, adjustSetting } from './settings.js'

// The menus (title, pause, settings, map, ending) as plain state, so they
// can be tested without Phaser or React. scenes/MenuScene.js feeds it
// intents from InputState and from clicks on the HTML menus, and carries out
// the effects it returns; ui/Menus.jsx draws `menuView`.
//
// A menu is { screen, cursor, stack }: the screen shown, the highlighted
// item, and the screens to go back to. `ctx` is { hasSave, settings,
// canVibrate }.

export const MENU = {
  TITLE: 'title',
  CONFIRM_NEW: 'confirmNew',
  PAUSE: 'pause',
  SETTINGS: 'settings',
  MAP: 'map',
  ENDING: 'ending',
}

export const INTENT = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  CONFIRM: 'confirm',
  BACK: 'back',
}

// What the menu asks the game to do.
export const MENU_ACTION = {
  CONTINUE: 'continue',
  NEW_GAME: 'newGame',
  RESUME: 'resume',
  QUIT: 'quit',
  TO_TITLE: 'toTitle',
}

// Feedback sounds, named here and mapped to sounds by the scene.
export const MENU_SOUND = {
  MOVE: 'move',
  SELECT: 'select',
  BACK: 'back',
  ADJUST: 'adjust',
}

const TITLES = {
  [MENU.TITLE]: null,
  [MENU.CONFIRM_NEW]: 'Start a new game?',
  [MENU.PAUSE]: 'Paused',
  [MENU.SETTINGS]: 'Settings',
  [MENU.MAP]: null,
  [MENU.ENDING]: null,
}

const percent = (value) => `${Math.round(value * 100)}%`
const onOff = (value) => (value ? 'On' : 'Off')

function settingsItems({ settings, canVibrate }) {
  return [
    { id: 'volume', label: 'Volume', kind: 'slider', value: settings.volume, valueText: percent(settings.volume) },
    { id: 'music', label: 'Music', kind: 'slider', value: settings.music, valueText: percent(settings.music) },
    { id: 'muted', label: 'Mute', kind: 'toggle', value: settings.muted, valueText: onOff(settings.muted) },
    { id: 'touchOpacity', label: 'Touch controls', kind: 'slider', value: settings.touchOpacity, valueText: percent(settings.touchOpacity) },
    canVibrate
      ? { id: 'haptics', label: 'Vibration', kind: 'toggle', value: settings.haptics, valueText: onOff(settings.haptics) }
      : { id: 'haptics', label: 'Vibration', kind: 'toggle', value: false, valueText: 'Not on this device', disabled: true },
    { id: 'back', label: 'Back', kind: 'action' },
  ]
}

/** The items on a screen: { id, label, kind ('action', 'slider' or 'toggle'), value, valueText, disabled }. */
export function menuItems(screen, ctx) {
  switch (screen) {
    case MENU.TITLE:
      return [
        { id: 'continue', label: 'Continue', kind: 'action', disabled: !ctx.hasSave },
        { id: 'newGame', label: 'New game', kind: 'action' },
        { id: 'settings', label: 'Settings', kind: 'action' },
      ]
    case MENU.CONFIRM_NEW:
      return [
        { id: 'confirmNew', label: 'Start over', kind: 'action', note: 'Your saved progress will be lost.' },
        { id: 'cancel', label: 'Keep my save', kind: 'action' },
      ]
    case MENU.PAUSE:
      return [
        { id: 'resume', label: 'Resume', kind: 'action' },
        { id: 'map', label: 'Area map', kind: 'action' },
        { id: 'settings', label: 'Settings', kind: 'action' },
        { id: 'quit', label: 'Quit to title', kind: 'action' },
      ]
    case MENU.SETTINGS:
      return settingsItems(ctx)
    case MENU.ENDING:
      return [{ id: 'toTitle', label: 'Back to the title', kind: 'action' }]
    default:
      return []
  }
}

function firstEnabled(items) {
  const index = items.findIndex((item) => !item.disabled)
  return Math.max(0, index)
}

export function createMenu(screen, ctx) {
  return { screen, cursor: firstEnabled(menuItems(screen, ctx)), stack: [] }
}

function push(menu, screen, ctx) {
  return { screen, cursor: firstEnabled(menuItems(screen, ctx)), stack: [...menu.stack, { screen: menu.screen, cursor: menu.cursor }] }
}

function pop(menu) {
  const previous = menu.stack.at(-1)
  if (!previous) return menu
  return { ...previous, stack: menu.stack.slice(0, -1) }
}

// The next enabled item from the cursor, wrapping around.
function moveCursor(menu, items, direction) {
  const count = items.length
  for (let step = 1; step <= count; step++) {
    const index = (menu.cursor + direction * step + count * step) % count
    if (!items[index].disabled) return index
  }
  return menu.cursor
}

const result = (menu, effect = null, sound = null) => ({ menu, effect, sound })

function adjust(menu, item, direction, ctx) {
  if (item.disabled || (item.kind !== 'slider' && item.kind !== 'toggle')) return result(menu)
  const settings = adjustSetting(ctx.settings, item.id, direction)
  if (settings === ctx.settings || settings[item.id] === ctx.settings[item.id]) return result(menu)
  return result(menu, { type: 'settings', settings }, MENU_SOUND.ADJUST)
}

function confirm(menu, item, ctx) {
  if (!item || item.disabled) return result(menu)
  if (item.kind === 'toggle') return adjust(menu, item, 1, ctx)
  if (item.kind === 'slider') return result(menu)
  const action = (id) => result(menu, { type: 'action', id }, MENU_SOUND.SELECT)
  switch (item.id) {
    case 'continue':
      return action(MENU_ACTION.CONTINUE)
    case 'newGame':
      return ctx.hasSave ? result(push(menu, MENU.CONFIRM_NEW, ctx), null, MENU_SOUND.SELECT) : action(MENU_ACTION.NEW_GAME)
    case 'confirmNew':
      return action(MENU_ACTION.NEW_GAME)
    case 'resume':
      return action(MENU_ACTION.RESUME)
    case 'quit':
      return action(MENU_ACTION.QUIT)
    case 'toTitle':
      return action(MENU_ACTION.TO_TITLE)
    case 'settings':
      return result(push(menu, MENU.SETTINGS, ctx), null, MENU_SOUND.SELECT)
    case 'map':
      return result(push(menu, MENU.MAP, ctx), null, MENU_SOUND.SELECT)
    case 'cancel':
    case 'back':
      return result(pop(menu), null, MENU_SOUND.BACK)
    default:
      return result(menu)
  }
}

function back(menu) {
  if (menu.stack.length > 0) return result(pop(menu), null, MENU_SOUND.BACK)
  // Backing out of the pause menu resumes; the title and ending stay.
  if (menu.screen === MENU.PAUSE) return result(menu, { type: 'action', id: MENU_ACTION.RESUME }, MENU_SOUND.BACK)
  return result(menu)
}

/**
 * Applies one intent. Returns { menu, effect, sound }: the next menu state,
 * what the game should do (null, { type: 'action', id } or { type:
 * 'settings', settings }) and a MENU_SOUND for feedback (or null).
 */
export function applyIntent(menu, intent, ctx) {
  // The map is a picture: any confirm or back returns to the pause menu.
  if (menu.screen === MENU.MAP) {
    return intent === INTENT.CONFIRM || intent === INTENT.BACK ? result(pop(menu), null, MENU_SOUND.BACK) : result(menu)
  }
  const items = menuItems(menu.screen, ctx)
  const item = items[menu.cursor]
  switch (intent) {
    case INTENT.UP:
    case INTENT.DOWN: {
      const cursor = moveCursor(menu, items, intent === INTENT.UP ? -1 : 1)
      return cursor === menu.cursor ? result(menu) : result({ ...menu, cursor }, null, MENU_SOUND.MOVE)
    }
    case INTENT.LEFT:
    case INTENT.RIGHT:
      return item ? adjust(menu, item, intent === INTENT.LEFT ? -1 : 1, ctx) : result(menu)
    case INTENT.CONFIRM:
      return confirm(menu, item, ctx)
    case INTENT.BACK:
      return back(menu)
    default:
      return result(menu)
  }
}

/** Highlights item `index` (a pointer moved over it); disabled items can't be. */
export function focusItem(menu, index, ctx) {
  const item = menuItems(menu.screen, ctx)[index]
  if (!item || item.disabled || index === menu.cursor) return menu
  return { ...menu, cursor: index }
}

/** A click or tap on item `index`: focus it, then confirm it. */
export function activateItem(menu, index, ctx) {
  const item = menuItems(menu.screen, ctx)[index]
  if (!item || item.disabled) return result(menu)
  return applyIntent({ ...menu, cursor: index }, INTENT.CONFIRM, ctx)
}

/** A click on a slider's − or + (`direction` -1 or 1). */
export function adjustItem(menu, index, direction, ctx) {
  const item = menuItems(menu.screen, ctx)[index]
  if (!item) return result(menu)
  return adjust({ ...menu, cursor: index }, item, direction, ctx)
}

/** Menu intents from the frame's input: navigation, jump confirms, dash or pause go back. */
export function menuIntents(input) {
  const intents = []
  if (input.justPressed('up')) intents.push(INTENT.UP)
  if (input.justPressed('down')) intents.push(INTENT.DOWN)
  if (input.justPressed('left')) intents.push(INTENT.LEFT)
  if (input.justPressed('right')) intents.push(INTENT.RIGHT)
  if (input.justPressed('jump')) intents.push(INTENT.CONFIRM)
  if (input.justPressed('dash') || input.justPressed('pause')) intents.push(INTENT.BACK)
  return intents
}

/** What the HTML menu draws: { screen, title, items, cursor, nested }. */
export function menuView(menu, ctx) {
  return {
    screen: menu.screen,
    title: TITLES[menu.screen],
    items: menuItems(menu.screen, ctx).map((item) => ({ ...item, range: SETTING_RANGES[item.id] ?? null })),
    cursor: menu.cursor,
    nested: menu.stack.length > 0,
  }
}
