import { useSyncExternalStore } from 'react'

/** The current GameBridge state; re-renders when the game updates it. */
export function useGameBridge(bridge) {
  return useSyncExternalStore(bridge.subscribe, bridge.getState)
}

/** One value from the bridge; re-renders only when that value changes. */
export function useBridgeValue(bridge, key) {
  return useSyncExternalStore(bridge.subscribe, () => bridge.getState()[key])
}
