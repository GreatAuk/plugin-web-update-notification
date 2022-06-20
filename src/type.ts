export interface Options {
  /** 轮询间隔（ms）, 默认 10 分钟 */
  checkInterval?: number
  /** 是否在 console 输出 commit-hash */
  logHash?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
}

interface NotificationProps {
  title?: string
  description?: string
  buttonText?: string
}
