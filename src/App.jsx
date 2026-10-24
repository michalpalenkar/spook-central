import { useEffect, useState } from 'react'
import Game from './Game.jsx'
import { BossBar } from './ui/BossBar.jsx'
import { AudioEngine } from './game/systems/AudioEngine.js'
import { GameBridge } from './game/systems/GameBridge.js'
import { setHapticsEnabled } from './game/systems/haptics.js'
import { loadSettings } from './game/systems/settings.js'
import { TouchInput } from './game/systems/TouchInput.js'
import { LoadingScreen, MapMenu, MenuScreen } from './ui/Menus.jsx'
import RotateDevice from './ui/RotateDevice.jsx'
import TouchControls from './ui/TouchControls.jsx'
import { useAudioUnlock } from './ui/useAudioUnlock.js'
import { useBridgeValue } from './ui/useGameBridge.js'
import { useMediaQuery } from './ui/useMediaQuery.js'
import { WorldMessages } from './ui/WorldMessages.jsx'

function App() {
  // Shared by the touch overlay (writes) and the game (polls it as an input source).
  const [touchInput] = useState(() => new TouchInput())
  // Written by the game, read by the HTML overlays (map, hints, toasts, menus).
  const [bridge] = useState(() => new GameBridge({ settings: loadSettings().settings }))
  // Every sound; it starts on the first tap or key press.
  const [audio] = useState(() => new AudioEngine(bridge.getState().settings))
  const isTouchDevice = useMediaQuery('(pointer: coarse)')
  const isPortrait = useMediaQuery('(pointer: coarse) and (orientation: portrait)')
  const settings = useBridgeValue(bridge, 'settings')
  const screen = useBridgeValue(bridge, 'screen')

  useAudioUnlock(audio, bridge)

  useEffect(() => {
    audio.configure(settings)
    setHapticsEnabled(settings.haptics)
  }, [audio, settings])

  // Turning the phone to portrait hides the game behind the rotate card; pause it.
  useEffect(() => {
    if (isPortrait) bridge.send({ type: 'pause' })
  }, [bridge, isPortrait])

  return (
    <>
      <Game touchInput={touchInput} bridge={bridge} audio={audio} />
      <WorldMessages bridge={bridge} isTouchDevice={isTouchDevice} />
      <BossBar bridge={bridge} />
      <MapMenu bridge={bridge} isTouchDevice={isTouchDevice} />
      <MenuScreen bridge={bridge} isTouchDevice={isTouchDevice} />
      {isTouchDevice && screen === 'playing' && <TouchControls touchInput={touchInput} opacity={settings.touchOpacity} />}
      {screen === 'loading' && <LoadingScreen />}
      <RotateDevice />
    </>
  )
}

export default App
