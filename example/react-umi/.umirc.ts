import { defineConfig} from 'umi'
import type { Options as WebUpdateNotificationOptions } from '@umijs/plugin-web-update-notification'

export default {
  npmClient: 'pnpm',
  plugins: ['@umijs/plugin-web-update-notification'],
  webUpdateNotification: {
    logHash: true,
    notificationProps: {
      title: '更新了！！'
    }
  } as WebUpdateNotificationOptions
}