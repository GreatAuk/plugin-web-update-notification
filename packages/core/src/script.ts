import type { Options } from './type'
import { CUSTOM_UPDATE_EVENT_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME } from './constant'

// bind notification click event, click to refresh page
const anchor = document.querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)
anchor?.addEventListener('click', () => {
  window.location.reload()
})

/**
 * It checks whether the system has been updated and if so, it shows a notification.
 * @param {Options} options - Options
 */
function webUpdateCheck_checkAndNotice(options: Options) {
  const checkSystemUpdate = () => {
    window
      .fetch(`./${JSON_FILE_NAME}.json?t=${Date.now()}`)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Failed to fetch ${JSON_FILE_NAME}.json`)

        return response.json()
      })
      .then((res) => {
        if (window.web_version_by_plugin !== res.version) {
          document.body.dispatchEvent(new CustomEvent(CUSTOM_UPDATE_EVENT_NAME, {
            detail: options,
            bubbles: true,
          }))
          if (!window.hasShowSystemUpdateNotice_plugin && !options.hiddenDefaultNotification) {
            webUpdateCheck_showNotification(options)
            // eslint-disable-next-line no-console
            console.log('system has update！！！')
          }
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
  setInterval(checkSystemUpdate, options.checkInterval || 10 * 60 * 1000)
  // when page visibility change, check system update
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      checkSystemUpdate()
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
 * show update notification
 */
function webUpdateCheck_showNotification(options: Options) {
  window.hasShowSystemUpdateNotice_plugin = true

  const { notificationProps, customNotificationHTML } = options

  const notification = document.createElement('div')
  let notificationInnerHTML = ''

  if (customNotificationHTML) {
    notificationInnerHTML = customNotificationHTML
  }
  else {
    const title = notificationProps?.title || '📢 &nbsp;系统升级通知'
    const description = notificationProps?.description || '检测到当前系统版本已更新，请刷新页面后使用。'
    const buttonText = notificationProps?.buttonText || '刷新'
    notification.classList.add('plugin-web-update-notice')
    notificationInnerHTML = `
    <div class="plugin-web-update-notice-content" data-cy="notification-content">
      <div class="plugin-web-update-notice-content-title">
        ${title}
      </div>
      <div class="plugin-web-update-notice-content-desc">
        ${description}
      </div>
      <a class="plugin-web-update-notice-refresh-btn">
        ${buttonText}
      </a>
    </div>`
  }

  notification.innerHTML = notificationInnerHTML
  document
    .querySelector(`.${NOTIFICATION_ANCHOR_CLASS_NAME}`)!
    .appendChild(notification)
}

// meaningless export, in order to let tsup bundle these functions
export {
  webUpdateCheck_checkAndNotice,
  webUpdateCheck_showNotification,
}
