import { execSync } from 'child_process'
import type { Options } from './type'
import type { CUSTOM_UPDATE_EVENT_NAME } from './constant'

/** A function that returns the hash of the current commit. */
export function getGitCommitHash() {
  let hash = ''
  try {
    hash = execSync('git rev-parse --short HEAD').toString().replace('\n', '')
  }
  catch (err) {
    console.warn(`
======================================================
[vite-plugin-web-update-notice] Not a git repository !
======================================================
    `)
  }
  return hash
}

/**
 * It checks whether the system has been updated and if so, it shows a notification.
 * @param {Options} options - Options
 */
export function webUpdateCheck_checkAndNotice(options: Options) {
  const checkSystemUpdate = () => {
    window
      .fetch(`./git-commit-hash.json?t=${Date.now()}`)
      .then((response) => {
        if (!response.ok)
          throw new Error('Failed to fetch git commit hash')

        return response.json()
      })
      .then((res) => {
        if (window.GIT_COMMIT_HASH !== res.hash) {
          if (!window.hasShowSystemUpdateNotice_vitePlugin) {
            webUpdateCheck_showNotification(options.notificationProps)
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
  checkSystemUpdate()
  setInterval(checkSystemUpdate, options.checkInterval || 10 * 60 * 1000)
  // 监听页面是否可见
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible')
      checkSystemUpdate()
  })
}

export function webUpdateCheck_bindSystemUpdateEvent(
  eventName: typeof CUSTOM_UPDATE_EVENT_NAME,
) {
  window.system_update_event_vite_plugin = new Event(eventName)
  document.addEventListener(eventName, () => {
    window.location.reload()
  })
}

/**
 * show update notification
 */
export function webUpdateCheck_showNotification(notificationProps: Options['notificationProps']) {
  const title = notificationProps?.title || '📢 &nbsp;系统升级通知'
  const description = notificationProps?.description || '检测到当前系统版本已更新，请刷新页面后使用。'
  const buttonText = notificationProps?.buttonText || '刷新'

  window.hasShowSystemUpdateNotice_vitePlugin = true
  const notification = document.createElement('div')
  notification.classList.add('vite-plugin-web-update-notice')
  notification.innerHTML = `
    <div class="vite-plugin-web-update-notice-content">
      <div class="vite-plugin-web-update-notice-content-title">
        ${title}
      </div>
      <div class="vite-plugin-web-update-notice-content-desc">
        ${description}
      </div>
      <a class="vite-plugin-web-update-notice-refresh-btn">
        ${buttonText}
      </a>
    </div>`
  document
    .querySelector('.vite-plugin-web-update-notice-anchor')!
    .appendChild(notification)
}
