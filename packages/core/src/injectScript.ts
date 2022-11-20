import type { Options } from './type'
import { CUSTOM_UPDATE_EVENT_NAME, JSON_FILE_NAME, LOCAL_STORAGE_PREFIX, NOTIFICATION_ANCHOR_CLASS_NAME, NOTIFICATION_DISMISS_BTN_CLASS_NAME, NOTIFICATION_REFRESH_BTN_CLASS_NAME } from './constant'

let hasShowSystemUpdateNotice = false
let latestVersion = ''

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
 * It checks whether the system has been updated and if so, it shows a notification.
 * @param {Options} options - Options
 */
function webUpdateCheck_checkAndNotice(options: Options) {
  const { injectFileBase = '', checkInterval, hiddenDefaultNotification } = options
  const checkSystemUpdate = () => {
    window
      .fetch(`${injectFileBase}${JSON_FILE_NAME}.json?t=${performance.now()}`)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Failed to fetch ${JSON_FILE_NAME}.json`)

        return response.json()
      })
      .then(({ version: versionFromServer }: { version: string }) => {
        latestVersion = versionFromServer
        if (window.web_version_by_plugin !== versionFromServer) {
          // dispatch custom event
          document.body.dispatchEvent(new CustomEvent(CUSTOM_UPDATE_EVENT_NAME, {
            detail: options,
            bubbles: true,
          }))

          const dismiss = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${versionFromServer}`) === 'true'
          if (!hasShowSystemUpdateNotice && !hiddenDefaultNotification && !dismiss)
            handleShowNotification(options)
        }
      })
      .catch((err) => {
        console.error(err)
        // eslint-disable-next-line no-console
        console.log('Failed to check system update')
      })
  }

  // check system update after page loaded
  checkSystemUpdate()

  // polling check system update
  setInterval(checkSystemUpdate, checkInterval || 10 * 60 * 1000)

  const limitCheckSystemUpdate = limit(checkSystemUpdate, 5000)

  // when page visibility change, check system update
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      limitCheckSystemUpdate()
  })

  // when page focus, check system update
  window.addEventListener('focus', () => {
    limitCheckSystemUpdate()
  })

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
window.webUpdateCheck_checkAndNotice = webUpdateCheck_checkAndNotice

/**
 * Bind the refresh button click event to refresh the page, and bind the dismiss button click event to
 * hide the notification and dismiss the system update.
 */
function bindBtnEvent() {
  // bind refresh button click event, click to refresh page
  const refreshBtn = document.querySelector(`.${NOTIFICATION_REFRESH_BTN_CLASS_NAME}`)
  refreshBtn?.addEventListener('click', () => {
    window.location.reload()
  })

  // bind dismiss button click event, click to hide notification
  const dismissBtn = document.querySelector(`.${NOTIFICATION_DISMISS_BTN_CLASS_NAME}`)
  dismissBtn?.addEventListener('click', () => {
    try {
      hasShowSystemUpdateNotice = false
      document.querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)?.remove()
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${latestVersion}`, 'true')
    }
    catch (err) {
      console.error(err)
    }
  })
}

/**
 * show update notification
 */
function handleShowNotification(options: Options) {
  hasShowSystemUpdateNotice = true

  const { notificationProps, customNotificationHTML, hiddenDismissButton } = options

  const notification = document.createElement('div')
  let notificationInnerHTML = ''

  if (customNotificationHTML) {
    notificationInnerHTML = customNotificationHTML
  }
  else {
    const title = notificationProps?.title ?? '📢 &nbsp;系统升级通知'
    const description = notificationProps?.description ?? '检测到当前系统版本已更新，请刷新页面后使用。'
    const buttonText = notificationProps?.buttonText ?? '刷新'
    const dismissButtonText = notificationProps?.dismissButtonText ?? '忽略'
    const dismissButtonHtml = hiddenDismissButton ? '' : `<a class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn">${dismissButtonText}</a>`
    notification.classList.add('plugin-web-update-notice')
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
        <a class="plugin-web-update-notice-btn plugin-web-update-notice-refresh-btn">
          ${buttonText}
        </a>
      </div>
    </div>`
  }

  notification.innerHTML = notificationInnerHTML
  document
    .querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)!
    .appendChild(notification)

  bindBtnEvent()
}

// meaningless export, in order to let tsup bundle these functions
export {
  webUpdateCheck_checkAndNotice,
  handleShowNotification as webUpdateCheck_showNotification,
}
