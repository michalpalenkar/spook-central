import { useEffect, useRef } from 'react'

function Game({ touchInput, bridge, audio }) {
  const containerRef = useRef(null)

  useEffect(() => {
    // Phaser and the game load as their own chunk, so the page (and the
    // loading screen) shows before the ~1 MB engine has arrived.
    let game = null
    let cancelled = false
    import('./game/config.js').then(({ createGame }) => {
      if (cancelled) return
      game = createGame(containerRef.current, { touchInput, bridge, audio })
      // Exposed for debugging and automated checks in development only.
      if (import.meta.env.DEV) {
        window.__game = game
        window.__audio = audio
      }
    })
    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [touchInput, bridge, audio])

  return <div ref={containerRef} className="game-container" />
}

export default Game
