// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CUSTOM_UPDATE_EVENT_NAME,
  INJECT_SCRIPT_TAG_ID,
  LOCAL_STORAGE_PREFIX,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  NOTIFICATION_DISMISS_BTN_CLASS_NAME,
  NOTIFICATION_REFRESH_BTN_CLASS_NAME,
} from './constant'
import presetLocaleData from './locale'
import type { Options } from './type'

const NOW = new Date('2026-01-02T03:04:05.000Z').getTime()

type Visibility = 'visible' | 'hidden'

function defineVisibility(state: Visibility) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
}

function setVisibility(state: Visibility) {
  defineVisibility(state)
  window.dispatchEvent(new Event('visibilitychange'))
}

/** `fetch` that never settles, to count calls without driving the response pipeline */
function pendingFetch() {
  window.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch
}

/** `fetch` that resolves with the given version file */
function serverFetch(body: unknown, ok = true) {
  window.fetch = vi.fn(async () => ({ ok, json: async () => body })) as unknown as typeof fetch
}

const click = (className: string) => document.querySelector<HTMLElement>(`.${className}`)!.click()

const fetchCount = () => vi.mocked(window.fetch).mock.calls.length
const notification = () =>
  document.querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME} .plugin-web-update-notice`)

interface SetupOptions {
  visibility?: Visibility
  localVersion?: string
  scriptSrc?: string
}

/**
 * Load a fresh copy of the inject script (module state such as the interval timer is per import)
 * and run setup. Automatic triggers are off by default so each case opts into what it tests.
 */
async function setup(
  options: Options = {},
  { visibility = 'visible', localVersion = 'v1', scriptSrc }: SetupOptions = {},
) {
  defineVisibility(visibility)
  const attrs = [
    `data-id="${INJECT_SCRIPT_TAG_ID}"`,
    localVersion && `data-v="${localVersion}"`,
    scriptSrc && `src="${scriptSrc}"`,
  ]
    .filter(Boolean)
    .join(' ')
  document.body.innerHTML = `<script ${attrs}></script><div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`
  await import('./injectScript')
  window.__checkUpdateSetup__({ checkImmediately: false, checkOnWindowFocus: false, ...options })
}

// listeners registered by the script under test, removed after each case so module instances don't leak
let listeners: Parameters<typeof window.addEventListener>[] = []

beforeEach(() => {
  listeners = []
  const add = window.addEventListener.bind(window)
  vi.spyOn(window, 'addEventListener').mockImplementation((...args: Parameters<typeof add>) => {
    listeners.push(args)
    add(...args)
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.resetModules()
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
  pendingFetch()
})

afterEach(() => {
  vi.restoreAllMocks()
  listeners.forEach((args) => window.removeEventListener(...args))
  vi.clearAllTimers()
  vi.useRealTimers()
  localStorage.clear()
  document.body.innerHTML = ''
  window.history.replaceState(null, '', '/')
})

describe('timers', () => {
  it('checks once right after load when checkImmediately is true (default)', async () => {
    await setup({ checkImmediately: true, checkInterval: 0 })
    // deferred with setTimeout, not synchronous
    expect(fetchCount()).toBe(0)
    vi.advanceTimersByTime(0)
    expect(fetchCount()).toBe(1)
  })

  it('does not check on load when checkImmediately is false', async () => {
    await setup({ checkInterval: 0 })
    vi.advanceTimersByTime(60_000)
    expect(fetchCount()).toBe(0)
  })

  it('polls every checkInterval ms', async () => {
    await setup({ checkInterval: 1000 })
    vi.advanceTimersByTime(999)
    expect(fetchCount()).toBe(0)
    vi.advanceTimersByTime(1)
    expect(fetchCount()).toBe(1)
    vi.advanceTimersByTime(4000)
    expect(fetchCount()).toBe(5)
  })

  it('defaults checkInterval to 10 minutes', async () => {
    await setup()
    vi.advanceTimersByTime(10 * 60 * 1000 - 1)
    expect(fetchCount()).toBe(0)
    vi.advanceTimersByTime(1)
    expect(fetchCount()).toBe(1)
  })

  it('does not poll when checkInterval is 0', async () => {
    await setup({ checkInterval: 0 })
    vi.advanceTimersByTime(60 * 60 * 1000)
    expect(fetchCount()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops polling when hidden and resumes when visible again', async () => {
    await setup({ checkInterval: 1000 })
    vi.advanceTimersByTime(2000)
    expect(fetchCount()).toBe(2)

    setVisibility('hidden')
    vi.advanceTimersByTime(5000)
    expect(fetchCount()).toBe(2)

    setVisibility('visible')
    vi.advanceTimersByTime(1000)
    expect(fetchCount()).toBe(3)
  })

  it('does not stack intervals when a page opened in a background tab becomes visible', async () => {
    await setup({ checkInterval: 1000 }, { visibility: 'hidden' })
    vi.advanceTimersByTime(3000)
    expect(fetchCount()).toBe(0)

    setVisibility('visible')
    vi.advanceTimersByTime(3000)
    expect(fetchCount()).toBe(3)
  })

  it('keeps a single interval across repeated visibility changes', async () => {
    await setup({ checkInterval: 1000 })
    for (let i = 0; i < 3; i++) {
      setVisibility('visible')
      setVisibility('hidden')
      setVisibility('visible')
    }
    vi.advanceTimersByTime(3000)
    expect(fetchCount()).toBe(3)
  })

  it('checks on becoming visible when checkOnWindowFocus is true', async () => {
    await setup({ checkInterval: 0, checkOnWindowFocus: true })
    setVisibility('hidden')
    expect(fetchCount()).toBe(0)
    setVisibility('visible')
    expect(fetchCount()).toBe(1)
  })

  it('throttles focus checks to once per 5 seconds', async () => {
    await setup({ checkInterval: 0, checkOnWindowFocus: true })
    window.dispatchEvent(new Event('focus'))
    window.dispatchEvent(new Event('focus'))
    expect(fetchCount()).toBe(1)

    vi.advanceTimersByTime(4999)
    window.dispatchEvent(new Event('focus'))
    expect(fetchCount()).toBe(1)

    vi.advanceTimersByTime(1)
    window.dispatchEvent(new Event('focus'))
    expect(fetchCount()).toBe(2)
  })

  it('ignores focus when checkOnWindowFocus is false', async () => {
    await setup({ checkInterval: 0 })
    window.dispatchEvent(new Event('focus'))
    setVisibility('visible')
    expect(fetchCount()).toBe(0)
  })

  it('throttles manual checkUpdate() to once per 5 seconds', async () => {
    await setup({ checkInterval: 0 })
    window.pluginWebUpdateNotice_.checkUpdate()
    window.pluginWebUpdateNotice_.checkUpdate()
    expect(fetchCount()).toBe(1)
    vi.advanceTimersByTime(5000)
    window.pluginWebUpdateNotice_.checkUpdate()
    expect(fetchCount()).toBe(2)
  })

  it('checks when a script or link fails to load, but not other elements', async () => {
    await setup({ checkInterval: 0 })
    const script = document.createElement('script')
    const link = document.createElement('link')
    const img = document.createElement('img')
    document.body.append(script, link, img)

    img.dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(0)

    script.dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(1)

    vi.advanceTimersByTime(5000)
    link.dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(2)
  })

  it('throttles a burst of resource errors to a single check', async () => {
    await setup({ checkInterval: 0 })
    // e.g. several chunks 404 at once right after a deploy
    const scripts = Array.from({ length: 5 }, () => document.createElement('script'))
    const link = document.createElement('link')
    document.body.append(...scripts, link)

    scripts.forEach((s) => s.dispatchEvent(new Event('error')))
    link.dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(1)

    vi.advanceTimersByTime(4999)
    scripts[0].dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(1)

    vi.advanceTimersByTime(1)
    scripts[0].dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(2)
  })

  it('ignores resource errors when checkOnLoadFileError is false', async () => {
    await setup({ checkInterval: 0, checkOnLoadFileError: false })
    const script = document.createElement('script')
    document.body.append(script)
    script.dispatchEvent(new Event('error'))
    expect(fetchCount()).toBe(0)
  })
})

describe('fetch', () => {
  it('requests the version file with a cache-busting timestamp', async () => {
    await setup({ checkInterval: 0, injectFileBase: '/app/' })
    window.pluginWebUpdateNotice_.checkUpdate()
    expect(window.fetch).toHaveBeenCalledWith(
      `/app/pluginWebUpdateNotice/web_version_by_plugin.json?t=${NOW}`,
    )
  })

  it('does not fetch when the local version is missing', async () => {
    await setup({ checkInterval: 0 }, { localVersion: '' })
    window.pluginWebUpdateNotice_.checkUpdate()
    expect(fetchCount()).toBe(0)
    expect(console.error).toHaveBeenCalledWith(
      '[pluginWebUpdateNotice] Failed to get locale version',
    )
  })

  it('exposes the local version on window', async () => {
    serverFetch({ version: 'v1' })
    await setup({ checkInterval: 0 }, { localVersion: 'abc123' })
    window.pluginWebUpdateNotice_.checkUpdate()
    expect(window.pluginWebUpdateNotice_version).toBe('abc123')
  })

  describe('version comparison', () => {
    let onUpdate: ReturnType<typeof vi.fn<(e: CustomEvent) => void>>

    beforeEach(() => {
      onUpdate = vi.fn<(e: CustomEvent) => void>()
      document.addEventListener(CUSTOM_UPDATE_EVENT_NAME, onUpdate)
    })

    afterEach(() => {
      document.removeEventListener(CUSTOM_UPDATE_EVENT_NAME, onUpdate)
    })

    async function check() {
      window.pluginWebUpdateNotice_.checkUpdate()
      // flush the fetch -> json -> handler promise chain
      await vi.advanceTimersByTimeAsync(0)
    }

    it('does nothing when the server version equals the local one', async () => {
      serverFetch({ version: 'v1' })
      await setup({ checkInterval: 0 })
      await check()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(notification()).toBeNull()
    })

    it('dispatches the update event and shows the notification on a new version', async () => {
      serverFetch({ version: 'v2' })
      const options = { checkInterval: 0, locale: 'en_US' }
      await setup(options)
      await check()

      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(onUpdate.mock.calls[0][0].detail).toEqual({
        version: 'v2',
        options: { checkImmediately: false, checkOnWindowFocus: false, ...options },
      })
      expect(notification()).not.toBeNull()
      expect(notification()!.textContent).toContain(presetLocaleData.en_US.title)
    })

    it('shows the notification only once across repeated checks', async () => {
      serverFetch({ version: 'v2' })
      await setup({ checkInterval: 1000 })
      await vi.advanceTimersByTimeAsync(3000)

      expect(fetchCount()).toBe(3)
      expect(onUpdate).toHaveBeenCalledTimes(3)
      expect(document.querySelectorAll('.plugin-web-update-notice')).toHaveLength(1)
    })

    it('ignores a silent version', async () => {
      serverFetch({ version: 'v2', silence: true })
      await setup({ checkInterval: 0 })
      await check()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(notification()).toBeNull()
    })

    it('only dispatches the event when hiddenDefaultNotification is true', async () => {
      serverFetch({ version: 'v2' })
      await setup({ checkInterval: 0, hiddenDefaultNotification: true })
      await check()
      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(notification()).toBeNull()
    })

    it('does not show the notification for a dismissed version', async () => {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}v2`, 'true')
      serverFetch({ version: 'v2' })
      await setup({ checkInterval: 0 })
      await check()
      expect(onUpdate).toHaveBeenCalledTimes(1)
      expect(notification()).toBeNull()
    })

    it('logs and swallows a non-ok response', async () => {
      serverFetch({}, false)
      await setup({ checkInterval: 0 })
      await check()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        '[pluginWebUpdateNotice] Failed to check system update',
        expect.objectContaining({ message: 'Failed to fetch web_version_by_plugin.json' }),
      )
    })

    it('logs and swallows a network error', async () => {
      window.fetch = vi.fn(() =>
        Promise.reject(new TypeError('Failed to fetch')),
      ) as unknown as typeof fetch
      await setup({ checkInterval: 0 })
      await check()
      expect(onUpdate).not.toHaveBeenCalled()
      expect(console.error).toHaveBeenCalledWith(
        '[pluginWebUpdateNotice] Failed to check system update',
        expect.any(TypeError),
      )
    })
  })

  describe('notification buttons', () => {
    async function showNotification(options: Options = {}) {
      serverFetch({ version: 'v2' })
      await setup({ checkInterval: 0, ...options })
      window.pluginWebUpdateNotice_.checkUpdate()
      await vi.advanceTimersByTimeAsync(0)
      expect(notification()).not.toBeNull()
    }

    it('dismiss removes the notification and remembers the version', async () => {
      await showNotification()
      click(NOTIFICATION_DISMISS_BTN_CLASS_NAME)
      expect(notification()).toBeNull()
      expect(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}v2`)).toBe('true')
    })

    it('onClickDismiss / onClickRefresh override the default behaviour', async () => {
      await showNotification()
      const onClickDismiss = vi.fn()
      const onClickRefresh = vi.fn()
      Object.assign(window.pluginWebUpdateNotice_, { onClickDismiss, onClickRefresh })

      click(NOTIFICATION_DISMISS_BTN_CLASS_NAME)
      click(NOTIFICATION_REFRESH_BTN_CLASS_NAME)
      expect(onClickDismiss).toHaveBeenCalledWith('v2')
      expect(onClickRefresh).toHaveBeenCalledWith('v2')
      expect(notification()).not.toBeNull()
      expect(localStorage.length).toBe(0)
    })

    it('hiddenDismissButton hides the dismiss button', async () => {
      await showNotification({ hiddenDismissButton: true })
      expect(document.querySelector(`.${NOTIFICATION_DISMISS_BTN_CLASS_NAME}`)).toBeNull()
      expect(document.querySelector(`.${NOTIFICATION_REFRESH_BTN_CLASS_NAME}`)).not.toBeNull()
    })
  })
})

describe('version file url', () => {
  async function urlOnNestedRoute(injectFileBase: string, scriptSrc: string) {
    await setup({ injectFileBase, checkInterval: 0 }, { scriptSrc })
    // client-side navigation to a nested route after the script has loaded
    window.history.pushState(null, '', '/user/profile')
    window.pluginWebUpdateNotice_.checkUpdate()
    return String(vi.mocked(window.fetch).mock.calls[0][0]).split('?')[0]
  }

  it('resolves a relative base against the inject script, not the current route', async () => {
    const url = await urlOnNestedRoute(
      './',
      './pluginWebUpdateNotice/webUpdateNoticeInjectScript.abc.js',
    )
    expect(url).toBe(`${window.location.origin}/pluginWebUpdateNotice/web_version_by_plugin.json`)
  })

  it('keeps an absolute base unchanged', async () => {
    const url = await urlOnNestedRoute(
      '/app/',
      '/app/pluginWebUpdateNotice/webUpdateNoticeInjectScript.abc.js',
    )
    expect(url).toBe('/app/pluginWebUpdateNotice/web_version_by_plugin.json')
  })

  it('keeps a full URL base unchanged', async () => {
    const url = await urlOnNestedRoute(
      'https://cdn.example.com/',
      'https://cdn.example.com/pluginWebUpdateNotice/webUpdateNoticeInjectScript.abc.js',
    )
    expect(url).toBe('https://cdn.example.com/pluginWebUpdateNotice/web_version_by_plugin.json')
  })
})
