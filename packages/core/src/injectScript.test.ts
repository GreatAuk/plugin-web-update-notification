// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { INJECT_SCRIPT_TAG_ID } from './constant'

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  window.dispatchEvent(new Event('visibilitychange'))
}

async function setup(initialState: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => initialState,
  })
  await import('./injectScript')
  window.__checkUpdateSetup__({ checkInterval: 1000, checkImmediately: false, checkOnWindowFocus: false })
}

describe('injectScript polling', () => {
  // listeners registered by the script under test, removed after each case so module instances don't leak
  let listeners: Parameters<typeof window.addEventListener>[] = []

  beforeEach(() => {
    listeners = []
    const add = window.addEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation((...args: Parameters<typeof add>) => {
      listeners.push(args)
      add(...args)
    })
    vi.resetModules()
    vi.useFakeTimers()
    document.body.innerHTML = `<script data-id="${INJECT_SCRIPT_TAG_ID}" data-v="v1"></script>`
    window.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
    listeners.forEach(args => window.removeEventListener(...args))
    vi.clearAllTimers()
    vi.useRealTimers()
  })


  it('does not stack intervals when a page opened in a background tab becomes visible', async () => {
    await setup('hidden')
    vi.advanceTimersByTime(3000)
    expect(window.fetch).toHaveBeenCalledTimes(0)

    setVisibility('visible')
    vi.advanceTimersByTime(3000)
    expect(window.fetch).toHaveBeenCalledTimes(3)
  })

  it('keeps a single interval across repeated visibility changes', async () => {
    await setup('visible')
    for (let i = 0; i < 3; i++) {
      setVisibility('visible')
      setVisibility('hidden')
      setVisibility('visible')
    }
    vi.advanceTimersByTime(3000)
    expect(window.fetch).toHaveBeenCalledTimes(3)
  })
})
