import { useEffect, useRef } from 'react'
import { pointerActions } from '../game/systems/touchMapping.js'
import './TouchControls.css'

// Diamond layout mirroring the gamepad face buttons (A jump, B dash, X fire, Y trap).
const ACTION_BUTTONS = [
  { action: 'trap', label: 'Trap', slot: 'top' },
  { action: 'fire', label: 'Fire', slot: 'left' },
  { action: 'dash', label: 'Dash', slot: 'right' },
  { action: 'jump', label: 'Jump', slot: 'bottom' },
]

const DPAD_ARMS = ['up', 'left', 'right', 'down']

/**
 * On-screen controls for touch devices. Every finger is tracked by pointer
 * id; on each move the element under it is hit-tested again, so a finger can
 * slide from one button to another. Held actions go to `touchInput`, which
 * the game polls like any other InputState source.
 */
function TouchControls({ touchInput }) {
  const rootRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const dpad = root.querySelector('[data-touch="dpad"]')
    // pointerId -> whether that finger went down on the D-pad.
    const fingers = new Map()

    const hitAt = (x, y) => {
      const element = document.elementFromPoint(x, y)?.closest('[data-touch]')
      return element && root.contains(element) ? element.dataset.touch : null
    }

    const dpadGeometry = () => {
      const rect = dpad.getBoundingClientRect()
      return { cx: rect.left + rect.width / 2, cy: rect.top + rect.height / 2, radius: rect.width / 2 }
    }

    const showHeld = () => {
      const held = touchInput.heldActions()
      for (const element of root.querySelectorAll('[data-action]')) {
        element.classList.toggle('is-held', held.has(element.dataset.action))
      }
    }

    const track = (event) => {
      const point = { x: event.clientX, y: event.clientY }
      const actions = pointerActions({
        hit: hitAt(point.x, point.y),
        point,
        dpad: dpadGeometry(),
        anchoredToDpad: fingers.get(event.pointerId),
      })
      touchInput.setPointer(event.pointerId, actions)
      showHeld()
    }

    const onDown = (event) => {
      const hit = hitAt(event.clientX, event.clientY)
      if (!hit) return
      event.preventDefault()
      fingers.set(event.pointerId, hit === 'dpad')
      track(event)
    }

    const onMove = (event) => {
      if (fingers.has(event.pointerId)) track(event)
    }

    const onUp = (event) => {
      if (!fingers.delete(event.pointerId)) return
      touchInput.releasePointer(event.pointerId)
      showHeld()
    }

    const releaseAll = () => {
      fingers.clear()
      touchInput.releaseAll()
      showHeld()
    }

    const preventMenu = (event) => event.preventDefault()

    root.addEventListener('pointerdown', onDown)
    root.addEventListener('contextmenu', preventMenu)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('blur', releaseAll)
    document.addEventListener('visibilitychange', releaseAll)
    return () => {
      root.removeEventListener('pointerdown', onDown)
      root.removeEventListener('contextmenu', preventMenu)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('blur', releaseAll)
      document.removeEventListener('visibilitychange', releaseAll)
      releaseAll()
    }
  }, [touchInput])

  return (
    <div ref={rootRef} className="touch-controls" aria-hidden="true">
      <div className="touch-dpad" data-touch="dpad">
        {DPAD_ARMS.map((direction) => (
          <span key={direction} className={`touch-dpad-arm touch-dpad-${direction}`} data-action={direction} />
        ))}
        <span className="touch-dpad-hub" />
      </div>

      <div className="touch-actions">
        {ACTION_BUTTONS.map(({ action, label, slot }) => (
          <div key={action} className={`touch-button touch-slot-${slot}`} data-touch={action} data-action={action}>
            {label}
          </div>
        ))}
      </div>

      <div className="touch-pause" data-touch="pause" data-action="pause">
        <span />
        <span />
      </div>
    </div>
  )
}

export default TouchControls
