# @plugin-web-update-notification/nuxt

Nuxt module for detecting web page updates and notifying users to reload. Supports Nuxt 3+ in SSG, SPA, and SSR modes.

## Install

```bash
pnpm add @plugin-web-update-notification/nuxt -D
```

## Usage

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@plugin-web-update-notification/nuxt'],
  webUpdateNotification: {
    logVersion: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: '系统升级通知',
      description: '系统更新啦！请刷新后使用。',
      buttonText: '刷新',
      dismissButtonText: '忽略',
    },
  },
})
```

The module only runs in production builds. It reuses the shared options from
`@plugin-web-update-notification/core`; see the root README for the full option list.

> Types: add `/// <reference types="@plugin-web-update-notification/nuxt" />` to get
> `window.pluginWebUpdateNotice_` typings.
