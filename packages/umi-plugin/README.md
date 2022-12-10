English | [简体中文](./README.zh-CN.md)

# plugin-web-update-notification

<p align="center">
    <a href="https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js">
      <img src="https://img.badgesize.io/https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js?compression=gzip&style=flat-square" alt="Gzip Size" />
    </a>
    <a href="https://www.npmjs.com/package/@plugin-web-update-notification/core">
      <img src="https://img.shields.io/npm/v/@plugin-web-update-notification/core.svg?style=flat-square&colorB=51C838" alt="NPM Version" />
    </a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/blob/master/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/discussions">
      <img src="https://img.shields.io/badge/discussions-on%20github-blue?style=flat-square&colorB=51C838" alt="discussions-image" />
    </a>
    <br>
</p>


Detect webpage updates and notify user to reload. support vite, umijs and webpack.

> Take the git commit hash (also support package.json version、build timestamp) as the version number, and write version into json file. The client polls the version of the server (visibilitychange or focus event assistant), compares it with the local one, and if it is not the same, notifies the user to refresh the page (you can custom behavior).

<p align="center">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_umi_example.webp">
</p>

**When to check for updates (fetch version.json)** ?

1. first load page.
2. poll (default: 10 * 60 * 1000 ms).
3. script resource loading failure detected (404 ?).
4. when the browser window is refocus or revisible.

## Why

Some users do not have the habit of closing web pages. If the front-end page is updated, the user page may report an error (file 404) or a white screen.

## Install

```bash
# vite
pnpm add @plugin-web-update-notification/vite -D

# umijs
pnpm add @plugin-web-update-notification/umijs -D

# webpack plugin
pnpm add @plugin-web-update-notification/webpack -D
```

## Usage

[vite](#vite) | [umi](#umijs) | [webpack](#webpack)

### Vite

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { webUpdateNotice } from '@plugin-web-update-notification/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logVersion: true,
    }),
  ]
})
```

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      // custom notification text
      notificationProps: {
        title: 'system update',
        description: 'System update, please refresh the page',
        buttonText: 'refresh',
      },
    }),
  ]
})
```

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      // custom notification UI
      customNotificationHTML: `
        <div style="background-color: #fff;padding: 24px;border-radius: 4px;position: fixed;top: 24px;right: 24px;border: 1px solid;">
          System update, please refresh the page
        </div>
      `,
    }),
  ]
})
```

```ts
// hidden default notification, listener to update event and custom behavior.
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      hiddenDefaultNotification: true
    }),
  ]
})

// other file to listener custom update event
document.body.addEventListener('plugin_web_update_notice', (options) => {
  console.log(options)
  alert('System update!')
})
```

### Umijs

```ts
// .umirc.ts
import { defineConfig } from 'umi'
import type { Options as WebUpdateNotificationOptions } from '@plugin-web-update-notification/umijs'

export default {
  plugins: ['@plugin-web-update-notification/umijs'],
  webUpdateNotification: {
    logVersion: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: 'system update',
      description: 'System update, please refresh the page',
      buttonText: 'refresh',
    },
  } as WebUpdateNotificationOptions
}
```

### webpack

```js
// vue.config.js(vue-cli project)
const { WebUpdateNotificationPlugin } = require('@plugin-web-update-notification/webpack')
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  // ...other config
  configureWebpack: {
    plugins: [
      new WebUpdateNotificationPlugin({
        logVersion: true,
      }),
    ],
  },
})
```



## Options

```ts
function webUpdateNotice(options?: Options): Plugin

interface Options {
  /** default is 'git_commit_hash' */
  versionType?: 'git_commit_hash' | 'pkg_version' | 'build_timestamp'
  /** polling interval（ms）, default 10*60*1000 */
  checkInterval?: number
  /** whether to output commit-hash in console */
  logVersion?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
  hiddenDefaultNotification?: boolean
  hiddenDismissButton?: boolean
  /** index.html file path, by default, we will look up path.resolve(webpackOutputPath, './index.html') */
  indexHtmlFilePath?: string // !!! only webpack plugin support

  /**
   * Base public path for inject file, Valid values include:
   * * Absolute URL pathname, e.g. /foo/
   * * Full URL, e.g. https://foo.com/
   * * Empty string(default) or ./
   */
  injectFileBase?: string
}

interface NotificationProps {
  title?: string
  description?: string
  buttonText?: string
  /** dismiss button text */
  dismissButtonText?: string
}
```

## License

[MIT](./LICENSE)
