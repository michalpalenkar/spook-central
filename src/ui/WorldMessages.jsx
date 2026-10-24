import { hintId, hintText } from './hintText.js'
import { useGameBridge } from './useGameBridge.js'
import './WorldMessages.css'

/**
 * In-world text over the game: the area name when entering an area (top),
 * short toasts such as "progress saved", and the hint for where the player
 * stands.
 * Neither takes input, so touches pass through to the controls.
 */
export function WorldMessages({ bridge, isTouchDevice }) {
  const { hint, toast, banner, mapOpen } = useGameBridge(bridge)
  const text = hint && !mapOpen ? hintText(hint, isTouchDevice) : null

  return (
    <div className="world-messages" aria-live="polite">
      {/* Keyed by id so the fade animation restarts for every message. */}
      {banner && (
        <div key={banner.id} className="world-banner">
          {banner.text}
        </div>
      )}
      {toast && (
        <div key={toast.id} className="world-toast">
          {toast.text}
        </div>
      )}
      {text && (
        <div key={hintId(hint)} className="world-hint">
          {text}
        </div>
      )}
    </div>
  )
}
