import { useGameBridge } from './useGameBridge.js'
import './ornaments.css'
import './BossBar.css'

/**
 * The boss's name and strength along the bottom of the screen during a boss
 * fight, with a pip per round for bosses that take several traps.
 */
export function BossBar({ bridge }) {
  const { boss, mapOpen } = useGameBridge(bridge)
  if (!boss || mapOpen) return null
  const rounds = Array.from({ length: boss.phases }, (_, i) => i)

  return (
    <div className="boss-bar" role="status" aria-label={`${boss.name}, ${Math.round(boss.health * 100)}%`}>
      <div className="boss-name">
        {boss.name}
        {boss.phases > 1 && (
          <span className="boss-rounds">
            {rounds.map((i) => (
              <i key={i} className={i < boss.phase - 1 ? 'is-done' : ''} />
            ))}
          </span>
        )}
      </div>
      <div className="boss-track">
        <div className="boss-fill" style={{ transform: `scaleX(${boss.health})` }} />
      </div>
    </div>
  )
}
