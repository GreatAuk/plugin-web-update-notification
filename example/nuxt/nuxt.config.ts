import { defineNuxtConfig } from 'nuxt/config'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: process.env.NUXT_SSR !== 'false',
  modules: ['@plugin-web-update-notification/nuxt'],
  webUpdateNotification: {
    logVersion: true,
    versionType: 'build_timestamp',
    checkInterval: 1000 * 5,
    notificationProps: {
      title: '📢 system update',
      description: 'System update, please refresh the page',
      buttonText: 'refresh',
      dismissButtonText: 'dismiss',
    },
    notificationConfig: {
      primaryColor: 'red',
      secondaryColor: 'blue',
      placement: 'topRight',
    },
  },
})
