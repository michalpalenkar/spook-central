import { describe, expect, it, vi } from 'vitest'
import { GameBridge } from './GameBridge.js'

describe('GameBridge', () => {
  it('replaces state and notifies subscribers on change', () => {
    const bridge = new GameBridge()
    const listener = vi.fn()
    const unsubscribe = bridge.subscribe(listener)
    const before = bridge.getState()
    bridge.update({ hint: 'move' })
    expect(bridge.getState()).not.toBe(before)
    expect(bridge.getState().hint).toBe('move')
    expect(listener).toHaveBeenCalledTimes(1)

    bridge.update({ hint: 'move' })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    bridge.update({ hint: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('gives every toast a new id', () => {
    const bridge = new GameBridge()
    bridge.toast('Saved')
    const first = bridge.getState().toast
    bridge.toast('Saved')
    expect(bridge.getState().toast.id).not.toBe(first.id)
    expect(bridge.getState().toast.text).toBe('Saved')
  })

  it('keeps area banners and toasts in separate slots', () => {
    const bridge = new GameBridge()
    bridge.toast('Save could not be loaded')
    bridge.announceArea('firehouse', 'Firehouse')
    const { toast, banner, area } = bridge.getState()
    expect(toast.text).toBe('Save could not be loaded')
    expect(banner.text).toBe('Firehouse')
    expect(banner.id).not.toBe(toast.id)
    expect(area).toBe('firehouse')
  })

  it('works with detached methods, as useSyncExternalStore calls them', () => {
    const bridge = new GameBridge()
    const { subscribe, getState } = bridge
    const listener = vi.fn()
    subscribe(listener)
    bridge.update({ mapOpen: true })
    expect(getState().mapOpen).toBe(true)
    expect(listener).toHaveBeenCalled()
  })
})
