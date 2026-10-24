import { useState } from 'react'
import Game from './Game.jsx'
import { TouchInput } from './game/systems/TouchInput.js'
import RotateDevice from './ui/RotateDevice.jsx'
import TouchControls from './ui/TouchControls.jsx'
import { useMediaQuery } from './ui/useMediaQuery.js'

function App() {
  // Shared by the touch overlay (writes) and the game (polls it as an input source).
  const [touchInput] = useState(() => new TouchInput())
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  return (
    <>
      <Game touchInput={touchInput} />
      {isTouchDevice && <TouchControls touchInput={touchInput} />}
      <RotateDevice />
    </>
  )
}

export default App
