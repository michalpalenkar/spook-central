import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { createGameConfig } from './game/config.js'

function Game({ touchInput, bridge }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const game = new Phaser.Game(createGameConfig(containerRef.current, { touchInput, bridge }))
    // Exposed for debugging and automated checks in development only.
    if (import.meta.env.DEV) window.__game = game
    return () => game.destroy(true)
  }, [touchInput, bridge])

  return <div ref={containerRef} className="game-container" />
}

export default Game
