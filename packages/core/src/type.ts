export interface Options {
  /**
   * ```text
   * support 'git_commit_hash' | 'pkg_version' | 'build_timestamp'
   * default is 'git_commit_hash'
   * ```
   * */
  versionType?: VersionType
  /** polling interval（ms）, default 10*60*1000 */
  checkInterval?: number
  /** whether to output version in console */
  logVersion?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
  hiddenDefaultNotification?: boolean
  hiddenDismissButton?: boolean
  /**
   * Base public path for inject file, Valid values include:
   * * Absolute URL pathname, e.g. /foo/
   * * Full URL, e.g. https://foo.com/
   * * Empty string(default) or ./
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
