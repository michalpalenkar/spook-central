import { AREAS } from '../game/levels/world.js'
import { useBridgeValue, useGameBridge } from './useGameBridge.js'
import './ornaments.css'
import './Menus.css'

// Margin around the explored rooms, in tiles.
const MAP_PADDING = 6

/**
 * The area map, opened from the pause menu (the game toggles it through the
 * bridge). It draws only the rooms visited so far, as the shape of their
 * open space, plus stubs for exits that lead somewhere unexplored. A tap or
 * click goes back to the pause menu.
 */
export function MapMenu({ bridge, isTouchDevice }) {
  const { mapOpen, map } = useGameBridge(bridge)
  if (!mapOpen || !map?.bounds) return null

  const { bounds } = map
  const viewBox = [
    bounds.x - MAP_PADDING,
    bounds.y - MAP_PADDING,
    bounds.width + MAP_PADDING * 2,
    bounds.height + MAP_PADDING * 2,
  ].join(' ')
  const current = map.rooms.find((room) => room.current)

  return (
    <div className="map-menu" role="dialog" aria-label="Area map" onClick={() => bridge.send({ type: 'menu-back' })}>
      <div className="map-frame">
        <header className="map-title">
          <span className="map-area">{current ? AREAS[current.area]?.name : 'Map'}</span>
          {current && <span className="map-room">{current.name}</span>}
        </header>

        <svg className="map-svg" viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
          {map.rooms.map((room) => (
            <g key={room.id} className={`map-room-shape map-area-${room.area}${room.current ? ' is-current' : ''}`}>
              <rect className="map-room-bounds" x={room.x} y={room.y} width={room.width} height={room.height} />
              {room.open.map((r) => (
                <rect
                  key={`${r.x}:${r.y}`}
                  className="map-room-open"
                  x={room.x + r.x}
                  y={room.y + r.y}
                  width={r.width}
                  height={r.height}
                />
              ))}
            </g>
          ))}

          {map.doors.map((door) => (
            <line
              key={`${door.from}:${door.to}:${door.x1}:${door.y1}`}
              className={door.explored ? 'map-door' : 'map-door is-unexplored'}
              x1={door.x1}
              y1={door.y1}
              x2={door.x2}
              y2={door.y2}
            />
          ))}

          {map.rooms
            .filter((room) => room.pole)
            .map(({ id, pole, saved }) => (
              <g key={`pole-${id}`} className={saved ? 'map-pole is-saved' : 'map-pole'}>
                <line x1={pole.x} y1={pole.y - 5} x2={pole.x} y2={pole.y} />
                <circle cx={pole.x} cy={pole.y - 5.6} r={1.1} />
              </g>
            ))}

          {map.player && <circle className="map-player" cx={map.player.x} cy={map.player.y} r={1.6} />}
        </svg>

        <footer className="map-legend">
          <span>
            <i className="map-key-pole" /> Fire pole
          </span>
          <span>
            <i className="map-key-unexplored" /> Unexplored
          </span>
          <span className="map-close">{isTouchDevice ? 'Tap to go back' : 'Esc or Space to go back'}</span>
        </footer>
      </div>
    </div>
  )
}

const TITLE_HELP = { keys: '↑ ↓ choose · ← → adjust · Space or Enter select · Esc back', touch: 'Tap to choose' }

/** "Loading…" while the game's code (mostly Phaser) arrives. */
export function LoadingScreen() {
  return (
    <div className="menu-screen menu-loading" role="status">
      <p className="menu-loading-text">Loading…</p>
    </div>
  )
}

/**
 * The title, pause, settings and ending menus. The game owns the menu state
 * (systems/menuModel.js through scenes/MenuScene.js) and publishes it here;
 * clicks and taps go back as commands. Keyboard and gamepad never reach
 * this component: the game reads them from InputState.
 */
export function MenuScreen({ bridge, isTouchDevice }) {
  const menu = useBridgeValue(bridge, 'menu')
  const ending = useBridgeValue(bridge, 'ending')
  if (!menu || menu.screen === 'map') return null
  const help = isTouchDevice ? TITLE_HELP.touch : TITLE_HELP.keys

  if (menu.screen === 'title') {
    return (
      <div className="menu-screen menu-title-screen">
        <header className="title-block">
          <p className="title-kicker">A paranormal investigation</p>
          <h1 className="title-name">Spook Central</h1>
          <p className="title-tagline">Four haunted corners of New York · one proton pack</p>
        </header>
        <MenuList bridge={bridge} menu={menu} />
        <footer className="menu-footer">
          <span>{help}</span>
          <span>An unofficial fan homage, drawn and voiced entirely in code</span>
        </footer>
      </div>
    )
  }

  if (menu.screen === 'ending') {
    return (
      <div className="menu-screen menu-ending-screen">
        <div className="menu-frame menu-ending-frame">
          <h1 className="ending-title">Spook Central is quiet again</h1>
          <p className="ending-text">
            The mascot is folded, one sticky handful at a time, into the biggest trap the Firehouse owns. The storm breaks
            over the rooftop, and far below a doorman sweeps marshmallow off the pavement and decides not to ask.
          </p>
          {ending && (
            <dl className="ending-stats">
              <div>
                <dt>Rooms explored</dt>
                <dd>
                  {ending.rooms} / {ending.totalRooms}
                </dd>
              </div>
              <div>
                <dt>Gear recovered</dt>
                <dd>
                  {ending.abilities} / {ending.totalAbilities}
                </dd>
              </div>
              <div>
                <dt>Ecto-essence</dt>
                <dd>{ending.essence}</dd>
              </div>
            </dl>
          )}
          <p className="ending-thanks">Thanks for playing this slice.</p>
          <MenuList bridge={bridge} menu={menu} />
        </div>
      </div>
    )
  }

  // Pause, settings and the new-game confirmation: a framed panel over the frozen game.
  const note = menu.items[menu.cursor]?.note ?? menu.items.find((item) => item.note)?.note
  return (
    <div className="menu-screen menu-pause-screen" role="dialog" aria-label={menu.title ?? 'Menu'}>
      <div className="menu-frame">
        {menu.title && <h2 className="menu-title">{menu.title}</h2>}
        {note && <p className="menu-note">{note}</p>}
        <MenuList bridge={bridge} menu={menu} />
        <p className="menu-help">{help}</p>
      </div>
    </div>
  )
}

function MenuList({ bridge, menu }) {
  return (
    <ul className="menu-list" role="menu">
      {menu.items.map((item, index) => (
        <MenuItem key={item.id} bridge={bridge} item={item} index={index} selected={index === menu.cursor} />
      ))}
    </ul>
  )
}

function MenuItem({ bridge, item, index, selected }) {
  const send = (type, extra = {}) => bridge.send({ type, index, ...extra })
  const className = ['menu-item', `menu-item-${item.kind}`, selected && 'is-selected', item.disabled && 'is-disabled']
    .filter(Boolean)
    .join(' ')
  const focus = () => send('menu-focus')

  if (item.kind === 'slider') {
    const { min, max } = item.range
    const fill = `${Math.round(((item.value - min) / (max - min)) * 100)}%`
    return (
      <li className={className} role="menuitem" onPointerEnter={focus}>
        <span className="menu-label">{item.label}</span>
        <span className="menu-slider">
          <button type="button" className="menu-step" aria-label={`Less ${item.label}`} onClick={() => send('menu-adjust', { direction: -1 })}>
            −
          </button>
          <span className="menu-slider-track">
            <span className="menu-slider-fill" style={{ width: fill }} />
          </span>
          <button type="button" className="menu-step" aria-label={`More ${item.label}`} onClick={() => send('menu-adjust', { direction: 1 })}>
            +
          </button>
        </span>
        <span className="menu-value">{item.valueText}</span>
      </li>
    )
  }

  if (item.kind === 'toggle') {
    return (
      <li className={className} role="menuitem" onPointerEnter={focus}>
        <span className="menu-label">{item.label}</span>
        <button type="button" className="menu-toggle" disabled={item.disabled} aria-pressed={item.value} onClick={() => send('menu-activate')}>
          {item.valueText}
        </button>
      </li>
    )
  }

  return (
    <li className={className} role="menuitem">
      <button type="button" className="menu-button" disabled={item.disabled} onPointerEnter={focus} onClick={() => send('menu-activate')}>
        <span className="menu-label">{item.label}</span>
        {item.valueText && <span className="menu-value">{item.valueText}</span>}
      </button>
    </li>
  )
}
