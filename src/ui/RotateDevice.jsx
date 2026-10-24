import './RotateDevice.css'

/**
 * Full-screen "rotate your device" notice. Shown purely by CSS, on touch
 * devices held in portrait.
 */
function RotateDevice() {
  return (
    <div className="rotate-device" role="alert">
      <svg className="rotate-device-icon" viewBox="0 0 64 64" aria-hidden="true">
        <rect x="22" y="8" width="20" height="36" rx="3" />
        <line x1="29" y1="39" x2="35" y2="39" />
        <path d="M12 50 A22 22 0 0 0 46 56" />
        <path d="M41 51 L46 56 L40 59" />
      </svg>
      <p className="rotate-device-title">Rotate your device</p>
      <p className="rotate-device-hint">Spook Central is played in landscape.</p>
    </div>
  )
}

export default RotateDevice
