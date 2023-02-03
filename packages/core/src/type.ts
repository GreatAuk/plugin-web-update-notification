export interface Options {
  /**
   * support 'git_commit_hash' | 'pkg_version' | 'build_timestamp' | 'custom'
   *
   * @default 'git_commit_hash'
   * */
  versionType?: VersionType
  /**
   * custom version, if versionType is 'custom', this option is required
   */
  customVersion?: string
  /** polling interval（ms）
   * @default 10 * 60 * 1000
   */
  checkInterval?: number
  /** whether to output version in console */
  logVersion?: boolean
  /**
   * @deprecated
   */
  customNotificationHTML?: string
  /** notificationProps have higher priority than locale */
  notificationProps?: NotificationProps
  /**
   * preset: zh_CN | zh_TW | en_US
   * @default 'zh_CN'
   * */
  locale?: string
  /**
   * custom locale data
   * @link default data: https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/src/locale.ts
   */
  localeData?: LocaleData
  /**
   * Whether to hide the default notification, if you set it to true, you need to custom behavior by yourself
   * ```ts
    document.body.addEventListener('plugin_web_update_notice', ({ options, version }) => {
      // write some code, show your custom notification and etc.
      alert('System update!')
    })
   * ```
   * @default false
   */
  hiddenDefaultNotification?: boolean
  /**
   * Whether to hide the dismiss button
   * @default false
   */
  hiddenDismissButton?: boolean
  /**
   * Base public path for inject file, Valid values include:
   * * Absolute URL pathname, e.g. /foo/
   * * Full URL, e.g. https://foo.com/
   * * Empty string(default) or ./
   * !!! Don't forget / at the end of the path
   */
  injectFileBase?: string
}

export type VersionType = 'git_commit_hash' | 'pkg_version' | 'build_timestamp' | 'custom'

export interface NotificationProps {
  title?: string
  description?: string
  /** refresh button text */
  buttonText?: string
  /** dismiss button text */
  dismissButtonText?: string
}

export type LocaleData = Record<string, NotificationProps>
