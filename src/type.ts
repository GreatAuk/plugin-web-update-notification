export interface Options {
  /** polling interval（ms）, default 10*60*1000 */
  checkInterval?: number
  /** whether to output commit-hash in console */
  logHash?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
  hiddenDefaultNotification?: boolean
}

interface NotificationProps {
  title?: string
  description?: string
  buttonText?: string
}
