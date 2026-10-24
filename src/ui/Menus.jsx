import { AREAS } from '../game/levels/world.js'
import { useGameBridge } from './useGameBridge.js'
import './Menus.css'

// Margin around the explored rooms, in tiles.
const MAP_PADDING = 6

/**
 * The area map, opened and closed with `pause` (the game toggles it through
 * the bridge). It draws only the rooms visited so far, as the shape of their
 * open space, plus stubs for exits that lead somewhere unexplored.
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
    <div className="map-menu" role="dialog" aria-label="Area map">
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
          <span className="map-close">{isTouchDevice ? '❚❚ to close' : 'Tab / Esc to close'}</span>
        </footer>
      </div>
    </div>
  )
}
