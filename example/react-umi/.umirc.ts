import { defineConfig} from 'umi'
import type { Options as WebUpdateNotificationOptions } from '@umijs/plugin-web-update-notification'

export default {
  npmClient: 'pnpm',
  plugins: ['@umijs/plugin-web-update-notification'],
  webUpdateNotification: {
    logHash: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: "system update",
      description: "System update, please refresh the page",
      buttonText: "refresh",
    },
  } as WebUpdateNotificationOptions
}