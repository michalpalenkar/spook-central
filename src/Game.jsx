import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { createGameConfig } from './game/config.js'

function Game() {
  const containerRef = useRef(null)

  useEffect(() => {
    const game = new Phaser.Game(createGameConfig(containerRef.current))
    // Exposed for debugging and automated checks in development only.
    if (import.meta.env.DEV) window.__game = game
    return () => game.destroy(true)
  }, [])

  return <div ref={containerRef} className="game-container" />
}

export default Game
