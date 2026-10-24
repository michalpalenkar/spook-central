import { useSyncExternalStore } from 'react'

/** The current GameBridge state; re-renders when the game updates it. */
export function useGameBridge(bridge) {
  return useSyncExternalStore(bridge.subscribe, bridge.getState)
}
