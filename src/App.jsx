import { useState } from 'react'
import Game from './Game.jsx'
import { GameBridge } from './game/systems/GameBridge.js'
import { TouchInput } from './game/systems/TouchInput.js'
import { MapMenu } from './ui/Menus.jsx'
import RotateDevice from './ui/RotateDevice.jsx'
import TouchControls from './ui/TouchControls.jsx'
import { useMediaQuery } from './ui/useMediaQuery.js'
import { WorldMessages } from './ui/WorldMessages.jsx'

function App() {
  // Shared by the touch overlay (writes) and the game (polls it as an input source).
  const [touchInput] = useState(() => new TouchInput())
  // Written by the game, read by the HTML overlays (map, hints, toasts).
  const [bridge] = useState(() => new GameBridge())
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  return (
    <>
      <Game touchInput={touchInput} bridge={bridge} />
      <WorldMessages bridge={bridge} isTouchDevice={isTouchDevice} />
      <MapMenu bridge={bridge} isTouchDevice={isTouchDevice} />
      {isTouchDevice && <TouchControls touchInput={touchInput} />}
      <RotateDevice />
    </>
  )
}

export default App
