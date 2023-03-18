import type { LocaleData, Options, VersionJSON } from './type'
import { CUSTOM_UPDATE_EVENT_NAME, DIRECTORY_NAME, JSON_FILE_NAME, LOCAL_STORAGE_PREFIX, NOTIFICATION_ANCHOR_CLASS_NAME, NOTIFICATION_DISMISS_BTN_CLASS_NAME, NOTIFICATION_POSITION_MAP, NOTIFICATION_REFRESH_BTN_CLASS_NAME } from './constant'
import presetLocaleData from './locale'

let hasShowSystemUpdateNotice = false
/** latest version from server */
let latestVersion = ''
let currentLocale = ''
let intervalTimer: NodeJS.Timer | undefined

/**
 * limit function
 * @param {Function} fn - The function to be called.
 * @param {number} delay - The amount of time to wait before calling the function.
 * @returns A function that called limit
 */
function limit(fn: Function, delay: number) {
  let pending = false
  return function (this: any, ...args: any[]) {
    if (pending)
      return
    pending = true
    fn.apply(this, args)
    setTimeout(() => {
      pending = false
    }, delay)
  }
}

/**
 * querySelector takes a string and returns an element.
 * @param {string} selector - string
 * @returns The first element that matches the selector.
 */
function querySelector(selector: string) {
  return document.querySelector(selector)
}

window.pluginWebUpdateNotice_ = {
  checkUpdate: () => {},
  dismissUpdate,
  closeNotification,
  setLocale: (locale: string) => {
    window.pluginWebUpdateNotice_.locale = locale
    currentLocale = locale
  },
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
  const checkSystemUpdate = () => {
    window
      .fetch(`${injectFileBase}${DIRECTORY_NAME}/${JSON_FILE_NAME}.json?t=${performance.now()}`)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Failed to fetch ${JSON_FILE_NAME}.json`)

        return response.json()
      })
      .then(({ version: versionFromServer, silence }: VersionJSON) => {
        if (silence)
          return
        latestVersion = versionFromServer
        if (window.pluginWebUpdateNotice_version !== versionFromServer) {
          // dispatch custom event
          document.body.dispatchEvent(new CustomEvent(CUSTOM_UPDATE_EVENT_NAME, {
            detail: {
              options,
              version: versionFromServer,
            },
            bubbles: true,
          }))

          const dismiss = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${versionFromServer}`) === 'true'
          if (!hasShowSystemUpdateNotice && !hiddenDefaultNotification && !dismiss)
            showNotification(options)
        }
      })
      .catch((err) => {
        console.error('[pluginWebUpdateNotice] Failed to check system update', err)
      })
  }

  if (checkImmediately) {
    // check system update after page loaded
    setTimeout(checkSystemUpdate)
  }

  /**
   * polling check system update
   */
  const pollingCheck = () => {
    if (checkInterval > 0)
      intervalTimer = setInterval(checkSystemUpdate, checkInterval)
  }
  pollingCheck()

  const limitCheckSystemUpdate = limit(checkSystemUpdate, 5000)

  window.pluginWebUpdateNotice_.checkUpdate = limitCheckSystemUpdate

  // when page visibility change, check system update
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pollingCheck()
      if (checkOnWindowFocus)
        limitCheckSystemUpdate()
    }
    if (document.visibilityState === 'hidden')
      intervalTimer && clearInterval(intervalTimer)
  })

  // when page focus, check system update
  window.addEventListener('focus', () => {
    if (checkOnWindowFocus)
      limitCheckSystemUpdate()
  })

  if (checkOnLoadFileError) {
    // listener script resource loading error
    window.addEventListener(
      'error',
      (err) => {
        const errTagName = (err?.target as any)?.tagName
        if (errTagName === 'SCRIPT')
          checkSystemUpdate()
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
  }
  catch (err) {
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
    hasShowSystemUpdateNotice = true

    const { notificationProps, notificationConfig, customNotificationHTML, hiddenDismissButton, locale = 'zh_CN', localeData: localeData_ } = options
    const localeData = Object.assign({}, presetLocaleData, localeData_)
    if (!currentLocale) {
      currentLocale = locale
      window.pluginWebUpdateNotice_.locale = locale
    }

    const notificationWrap = document.createElement('div')
    let notificationInnerHTML = ''

    if (customNotificationHTML) {
      notificationInnerHTML = customNotificationHTML
    }
    else {
      const { placement = 'bottomRight', primaryColor, secondaryColor } = notificationConfig || {}
      const title = notificationProps?.title ?? getLocaleText(currentLocale, 'title', localeData)
      const description = notificationProps?.description ?? getLocaleText(currentLocale, 'description', localeData)
      const buttonText = notificationProps?.buttonText ?? getLocaleText(currentLocale, 'buttonText', localeData)
      const dismissButtonText = notificationProps?.dismissButtonText ?? getLocaleText(currentLocale, 'dismissButtonText', localeData)
      const dismissButtonHtml = hiddenDismissButton ? '' : `<a class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn" style="color:${secondaryColor}">${dismissButtonText}</a>`

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
    document
      .querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)!
      .appendChild(notificationWrap)

    bindBtnEvent()
  }
  catch (err) {
    console.error('[pluginWebUpdateNotice] Failed to show notification', err)
  }
}

// meaningless export, in order to let tsup bundle these functions
export {
  __checkUpdateSetup__,
}
