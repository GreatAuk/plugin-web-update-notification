import { defineConfig } from 'umi'

export default defineConfig({
  outputPath: 'dist',
  plugins: ['@plugin-web-update-notification/umijs'],
  webUpdateNotification: {
    notificationConfig: {
      primaryColor: 'red',
    },
  },
})
