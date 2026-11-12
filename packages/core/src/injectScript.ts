import type { CheckUpdateResult, LocaleData, Options, VersionJSON } from './type'
import {
  CUSTOM_UPDATE_EVENT_NAME,
  DIRECTORY_NAME,
  INJECT_SCRIPT_TAG_ID,
  JSON_FILE_NAME,
  LOCAL_STORAGE_PREFIX,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  NOTIFICATION_DISMISS_BTN_CLASS_NAME,
  NOTIFICATION_POSITION_MAP,
  NOTIFICATION_REFRESH_BTN_CLASS_NAME,
} from './constant'
import presetLocaleData from './locale'

let hasShowSystemUpdateNotice = false
/** latest version from server */
let latestVersion = ''
let currentLocale = ''
let intervalTimer: ReturnType<typeof setInterval> | undefined

/**
 * limit function: calls within `delay` after an execution are ignored and get the result of that
 * execution instead
 * @param {Function} fn - The function to be called.
 * @param {number} delay - The amount of time to wait before calling the function.
 * @returns A function that called limit
 */
function limit<T>(fn: () => T, delay: number) {
  let pending = false
  let lastResult: T
  return function () {
    if (pending) return lastResult
    pending = true
    lastResult = fn()
    setTimeout(() => {
      pending = false
    }, delay)
    return lastResult
  }
}

/**
 * It reloads the current page without using the browser cache
 */
// function reloadPageWithoutCache() {
//   const url = new URL(window.location.href)
//   url.searchParams.set('__time__', Date.now().toString())
//   window.location.replace(url.href)
// }

/**
 * querySelector takes a string and returns an element.
 * @param {string} selector - string
 * @returns The first element that matches the selector.
 */
function querySelector<E extends Element = Element>(selector: string) {
  return document.querySelector<E>(selector)
}

window.pluginWebUpdateNotice_ = {
  checkUpdate: () => Promise.resolve({ updated: false, version: '' }),
  dismissUpdate,
  closeNotification,
  setLocale: (locale: string) => {
    window.pluginWebUpdateNotice_.locale = locale
    currentLocale = locale
  },
}

/**
 * Get the version from the script tag
 */
function getLocaleVersion() {
  const script = querySelector(`script[data-id="${INJECT_SCRIPT_TAG_ID}"]`)
  if (!script) return ''
  const version = script.getAttribute('data-v')
  if (!version) return ''

  window.pluginWebUpdateNotice_version = version
  return version
}

/**
 * Resolve the URL of the version JSON file once, at setup time.
 *
 * A relative `injectFileBase` (e.g. Vite `base: './'`) would otherwise be resolved by `fetch`
 * against the *current* page URL, which changes after client-side navigation in history-mode
 * SPAs (`/user/profile` -> `/user/pluginWebUpdateNotice/...` 404). The JSON file always sits next
 * to the inject script, so we resolve it against the script's own (already absolute) `src`.
 */
function getVersionFileUrl(injectFileBase: string) {
  const path = `${injectFileBase}${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`
  // root-relative path, protocol-relative or absolute URL: independent of the page URL
  if (injectFileBase.startsWith('/') || /^[a-z][a-z\d+.-]*:/i.test(injectFileBase)) return path

  const script = querySelector<HTMLScriptElement>(`script[data-id="${INJECT_SCRIPT_TAG_ID}"]`)
  try {
    if (script?.src) return new URL(`${JSON_FILE_NAME}.json`, script.src).href
    return new URL(path, document.baseURI).href
  } catch {
    return path
  }
}

/**
 * It checks whether the system has been updated and if so, it shows a notification.
 * @param {Options} options - Options
 */
function __checkUpdateSetup__(options: Options) {
  const {
    injectFileBase = '',
    checkInterval = 10 * 60 * 1000,
    hiddenDefaultNotification,
    checkOnWindowFocus = true,
    checkImmediately = true,
    checkOnLoadFileError = true,
  } = options
  const versionFileUrl = getVersionFileUrl(injectFileBase)
  const checkSystemUpdate = (): Promise<CheckUpdateResult> => {
    const localeVersion = getLocaleVersion()
    if (!localeVersion) {
      console.error('[pluginWebUpdateNotice] Failed to get locale version')
      return Promise.resolve({ updated: false, version: '' })
    }

    return (
      window
        .fetch(`${versionFileUrl}?t=${Date.now()}`, { cache: 'no-store' })
        .then((response) => {
          if (!response.ok) throw new Error(`Failed to fetch ${JSON_FILE_NAME}.json`)

          return response.json()
        })
        // the inject script runs in <head>, so the response may arrive while the parser is still
        // blocked before <body> or the notification anchor (e.g. by a synchronous app bundle)
        .then((versionJSON: VersionJSON) =>
          document.readyState === 'loading'
            ? new Promise<VersionJSON>((resolve) => {
                document.addEventListener('DOMContentLoaded', () => resolve(versionJSON), {
                  once: true,
                })
              })
            : versionJSON,
        )
        .then(({ version: versionFromServer, silence }: VersionJSON): CheckUpdateResult => {
          if (silence) return { updated: false, version: localeVersion }
          latestVersion = versionFromServer
          const updated = localeVersion !== versionFromServer
          if (updated) {
            // dispatch custom event
            document.body.dispatchEvent(
              new CustomEvent(CUSTOM_UPDATE_EVENT_NAME, {
                detail: {
                  options,
                  version: versionFromServer,
                },
                bubbles: true,
              }),
            )

            const dismiss =
              localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${versionFromServer}`) === 'true'
            if (!hasShowSystemUpdateNotice && !hiddenDefaultNotification && !dismiss)
              showNotification(options)
          }
          return { updated, version: versionFromServer }
        })
        // never rejects, so `await checkUpdate()` in a route guard can't break navigation
        .catch((err) => {
          console.error('[pluginWebUpdateNotice] Failed to check system update', err)
          return { updated: false, version: localeVersion }
        })
    )
  }

  if (checkImmediately) {
    // check system update after page loaded
    setTimeout(checkSystemUpdate)
  }

  /**
   * polling check system update
   */
  const stopPolling = () => {
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = undefined
    }
  }
  const pollingCheck = () => {
    // always clear the previous timer first, so repeated calls never stack intervals
    stopPolling()
    if (checkInterval > 0) intervalTimer = setInterval(checkSystemUpdate, checkInterval)
  }
  // a page opened in a background tab starts hidden; polling starts when it becomes visible
  if (document.visibilityState !== 'hidden') pollingCheck()

  const limitCheckSystemUpdate = limit(checkSystemUpdate, 5000)

  window.pluginWebUpdateNotice_.checkUpdate = limitCheckSystemUpdate

  // when page visibility change, check system update
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pollingCheck()
      if (checkOnWindowFocus) limitCheckSystemUpdate()
    }
    if (document.visibilityState === 'hidden') stopPolling()
  })

  // when page focus, check system update
  window.addEventListener('focus', () => {
    if (checkOnWindowFocus) limitCheckSystemUpdate()
  })

  if (checkOnLoadFileError) {
    // listener script resource loading error
    window.addEventListener(
      'error',
      (err) => {
        const errTagName = (err?.target as unknown as HTMLElement)?.tagName
        // throttled: several chunks often 404 at once after a deploy, one version check is enough
        if (errTagName === 'SCRIPT' || errTagName === 'LINK') limitCheckSystemUpdate()
      },
      true,
    )
  }
}

window.__checkUpdateSetup__ = __checkUpdateSetup__

/**
 * close notification, remove the notification from the DOM
 */
function closeNotification() {
  hasShowSystemUpdateNotice = false
  querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME} .plugin-web-update-notice`)?.remove()
}

/**
 * dismiss current update and hide notification
 */
function dismissUpdate() {
  try {
    closeNotification()
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${latestVersion}`, 'true')
  } catch (err) {
    console.error(err)
  }
}

/**
 * Bind the refresh button click event to refresh the page, and bind the dismiss button click event to
 * hide the notification and dismiss the system update.
 */
function bindBtnEvent() {
  // bind refresh button click event, click to refresh page
  const refreshBtn = querySelector(`.${NOTIFICATION_REFRESH_BTN_CLASS_NAME}`)
  refreshBtn?.addEventListener('click', () => {
    const { onClickRefresh } = window.pluginWebUpdateNotice_
    if (onClickRefresh) {
      onClickRefresh(latestVersion)
      return
    }
    window.location.reload()
  })

  // bind dismiss button click event, click to hide notification
  const dismissBtn = querySelector(`.${NOTIFICATION_DISMISS_BTN_CLASS_NAME}`)
  dismissBtn?.addEventListener('click', () => {
    const { onClickDismiss } = window.pluginWebUpdateNotice_
    if (onClickDismiss) {
      onClickDismiss(latestVersion)
      return
    }
    dismissUpdate()
  })
}

/**
 * It returns the value of the key in the localeData object, or the value of the key in the
 * presetLocaleData object, or the value of the key in the presetLocaleData.zh_CN object
 * @param {string} locale - The locale to be used, such as zh_CN, en_US, etc.
 * @param key - The key of the text to be obtained in the locale data.
 * @param {LocaleData} localeData - The locale data object that you passed in.
 * @returns The value of the key in the localeData object.
 */
function getLocaleText(locale: string, key: keyof LocaleData[string], localeData: LocaleData) {
  return localeData[locale]?.[key] ?? presetLocaleData[locale]?.[key] ?? presetLocaleData.zh_CN[key]
}

/**
 * show update notification
 */
function showNotification(options: Options) {
  try {
    const {
      notificationProps,
      notificationConfig,
      customNotificationHTML,
      hiddenDismissButton,
      locale = 'zh_CN',
      localeData: localeData_,
    } = options
    const localeData = Object.assign({}, presetLocaleData, localeData_)
    if (!currentLocale) {
      currentLocale = locale
      window.pluginWebUpdateNotice_.locale = locale
    }

    const notificationWrap = document.createElement('div')
    let notificationInnerHTML = ''

    if (customNotificationHTML) {
      notificationInnerHTML = customNotificationHTML
    } else {
      const { placement = 'bottomRight', primaryColor, secondaryColor } = notificationConfig || {}
      const title = notificationProps?.title ?? getLocaleText(currentLocale, 'title', localeData)
      const description =
        notificationProps?.description ?? getLocaleText(currentLocale, 'description', localeData)
      const buttonText =
        notificationProps?.buttonText ?? getLocaleText(currentLocale, 'buttonText', localeData)
      const dismissButtonText =
        notificationProps?.dismissButtonText ??
        getLocaleText(currentLocale, 'dismissButtonText', localeData)
      const dismissButtonHtml = hiddenDismissButton
        ? ''
        : `<a class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn" style="color:${secondaryColor}">${dismissButtonText}</a>`

      notificationWrap.classList.add('plugin-web-update-notice')
      notificationWrap.style.cssText = `${NOTIFICATION_POSITION_MAP[placement]}`
      notificationInnerHTML = `
    <div class="plugin-web-update-notice-content" data-cy="notification-content">
      <div class="plugin-web-update-notice-content-title">
        ${title}
      </div>
      <div class="plugin-web-update-notice-content-desc">
        ${description}
      </div>
      <div class="plugin-web-update-notice-tools">
        ${dismissButtonHtml}
        <a class="plugin-web-update-notice-btn plugin-web-update-notice-refresh-btn" style="color:${primaryColor}">
          ${buttonText}
        </a>
      </div>
    </div>`
    }

    notificationWrap.innerHTML = notificationInnerHTML
    querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)!.appendChild(notificationWrap)
    // only after a successful mount, so a failed one is retried by the next check
    hasShowSystemUpdateNotice = true

    bindBtnEvent()
  } catch (err) {
    console.error('[pluginWebUpdateNotice] Failed to show notification', err)
  }
}

// meaningless export, in order to let tsup bundle these functions
export { __checkUpdateSetup__ }
