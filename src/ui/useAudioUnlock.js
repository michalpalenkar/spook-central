import { useEffect } from 'react'

// Events that count as a user gesture for starting audio (iOS only lets an
// AudioContext start inside one). Pointer and touch releases cover taps,
// keydown the keyboard. Gamepad presses don't count, by browser rules.
const GESTURES = ['pointerup', 'pointerdown', 'touchend', 'keydown', 'click']

/**
 * Starts the AudioEngine on the first user gesture, and again after the
 * browser suspends it (iOS interruptions); suspends it while the page is
 * hidden and asks the game to pause then.
 */
export function useAudioUnlock(audio, bridge) {
  useEffect(() => {
    const unlock = () => audio.unlock()
    const onVisibility = () => {
      if (document.hidden) {
        bridge.send({ type: 'pause' })
        audio.suspend()
      } else {
        audio.resume()
      }
    }
    for (const type of GESTURES) window.addEventListener(type, unlock, { capture: true, passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      for (const type of GESTURES) window.removeEventListener(type, unlock, { capture: true })
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [audio, bridge])
}
