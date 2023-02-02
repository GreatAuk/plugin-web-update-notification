export interface Options {
  /**
   * support 'git_commit_hash' | 'pkg_version' | 'build_timestamp'
   *
   * default is 'git_commit_hash'
   * */
  versionType?: VersionType
  /** polling interval（ms）, default 10 * 60 * 1000 */
  checkInterval?: number
  /** whether to output version in console */
  logVersion?: boolean
  /**
   * @deprecated
   */
  customNotificationHTML?: string
  /** notificationProps have higher priority than locale */
  notificationProps?: NotificationProps
  /** locale default is zh_CN
   *
   * preset: zh_CN | zh_TW | en_US
   * */
  locale?: string
  localeData?: LocaleData
  /**
   * Whether to hide the default notification, default is false
   *
   * If you set it to true, you need to custom behavior by yourself
   */
  hiddenDefaultNotification?: boolean
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

export type VersionType = 'git_commit_hash' | 'pkg_version' | 'build_timestamp'

export interface NotificationProps {
  title?: string
  description?: string
  /** refresh button text */
  buttonText?: string
  /** dismiss button text */
  dismissButtonText?: string
}

export type LocaleData = Record<string, NotificationProps>
