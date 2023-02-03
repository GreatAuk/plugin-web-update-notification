English | [简体中文](./README.zh-CN.md)

# plugin-web-update-notification

<p align="center">
    <a href="https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js" target="__blank">
      <img src="https://img.badgesize.io/https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js?compression=gzip&style=flat-square" alt="Gzip Size" />
    </a>
    <a href="https://www.npmjs.com/package/@plugin-web-update-notification/core" target="__blank">
      <img src="https://img.shields.io/npm/v/@plugin-web-update-notification/core.svg?style=flat-square&colorB=51C838" alt="NPM Version" />
    </a>
    <a href="https://www.npmjs.com/package/@plugin-web-update-notification/core" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@plugin-web-update-notification/core?color=50a36f&label="></a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/blob/master/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/discussions" target="__blank">
      <img src="https://img.shields.io/badge/discussions-on%20github-blue?style=flat-square&colorB=51C838" alt="discussions-image" />
    </a>
    <br>
</p>


Detect webpage updates and notify user to reload. support vite, umijs and webpack.

> Take the git commit hash (also support package.json version、build timestamp、custom) as the version number, and write version into json file. The client polls the version of the server (visibilitychange or focus event assistant), compares it with the local one, and if it is not the same, notifies the user to refresh the page (you can custom behavior).

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
4. when the tab page is refocus or revisible.

## Why

Some users do not have the habit of closing web pages. If the front-end page is updated, the user page has always been a historical version, any there may be report an error (file 404) or a white screen.

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

**basic usage**

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

**custom notification text**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      notificationProps: {
        title: 'system update',
        description: 'System update, please refresh the page',
        buttonText: 'refresh',
      },
    }),
  ]
})
```

**internationalization**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      // plugin preset: zh_CN | zh_TW | en_US
      locale: "en_US",
      localeData: {
        en_US: {
          title: "📢 system update",
          description: "System update, please refresh the page",
          buttonText: "refresh",
          dismissButtonText: "dismiss",
        },
        zh_CN: {
          ...
        },
        ...
      },
    }),
  ],
});


// other file to set locale
window.pluginWebUpdateNotice_.setLocale('zh_CN')
```

**hidden default notification, listener to update event and custom behavior.**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      hiddenDefaultNotification: true
    }),
  ]
})

// other file to listener update event and custom behavior
document.body.addEventListener('plugin_web_update_notice', ({ options, version }) => {
  console.log(options)
  // write some code, show your custom notification and etc.
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
      dismissButtonText: 'dismiss',
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

export interface Options {
  /**
   * support 'git_commit_hash' | 'pkg_version' | 'build_timestamp' | 'custom'
   *
   * @default 'git_commit_hash'
   * */
  versionType?: VersionType
  /**
   * custom version, if versionType is 'custom', this option is required
   */
  customVersion?: string
  /** polling interval（ms）
   * @default 10 * 60 * 1000
   */
  checkInterval?: number
  /** whether to output version in console */
  logVersion?: boolean
  /**
   * @deprecated
   */
  customNotificationHTML?: string
  /** notificationProps have higher priority than locale */
  notificationProps?: NotificationProps
  /**
   * preset: zh_CN | zh_TW | en_US
   * @default 'zh_CN'
   * */
  locale?: string
  /**
   * custom locale data
   * @link default data: https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/src/locale.ts
   */
  localeData?: LocaleData
  /**
   * Whether to hide the default notification, if you set it to true, you need to custom behavior by yourself
   * ```ts
    document.body.addEventListener('plugin_web_update_notice', ({ options, version }) => {
      // write some code, show your custom notification and etc.
      alert('System update!')
    })
   * ```
   * @default false
   */
  hiddenDefaultNotification?: boolean
  /**
   * Whether to hide the dismiss button
   * @default false
   */
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
```

## Function
| name                                            | params                              | describe                                                     |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| window.pluginWebUpdateNotice_.setLocale         | locale(preset: zh_CN、zh_TW、en_US) | set locale                                                   |
| window.pluginWebUpdateNotice_.closeNotification |                                     | close notification                                           |
| window.pluginWebUpdateNotice_.dismissUpdate     |                                     | dismiss current update and close notification,same behavior as dismiss button |




## What was changed

![inject_content](https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/inject_content.webp)

## Q&A

1. `TypeScript` 的智能提示, 如果你想使用 `window.pluginWebUpdateNotice_.`。

   ```ts
   // src/shim.d.ts

   /// <reference types="@plugin-web-update-notification/core" />
   ```

2. request `version.json` file get `404 error`.

   If you upload the production files bundled to cdn server:

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === 'production'

   const cdnServerUrl = 'https://foo.com/'

   export default defineConfig({
     base: prod ? cdnServerUrl : '/',
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: cdnServerUrl
       })
     ]
   })
   ```

   Deploy the project in a non-root directory:

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === 'production'

   const base = '/folder/' // https://example.com/folder/

   export default defineConfig({
     base,
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: base
       })
     ]
   })
   ```

3. Custom notification button event.

   ```ts
   // refresh button click event, if you set it, it will cover the default event (location.reload())
   window.pluginWebUpdateNotice_.onClickRefresh = (version) => { alert(`click refresh btn: ${version}`) }

   // dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
   window.pluginWebUpdateNotice_.onClickDismiss = (version) => { alert(`click dismiss btn: ${version}`) }
   ```

4. Custom notification style.

   you can cover css styles with higher weights. ([default css file](https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/public/webUpdateNoticeInjectStyle.css))

   ```html
   <!-- notification html content -->

   <div class="plugin-web-update-notice-anchor">
     <div class="plugin-web-update-notice">
       <div class="plugin-web-update-notice-content" data-cy="notification-content">
         <div class="plugin-web-update-notice-content-title">
           📢  system update
         </div>
         <div class="plugin-web-update-notice-content-desc">
           System update, please refresh the page
         </div>
         <div class="plugin-web-update-notice-tools">
           <a class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn">dismiss</a>
           <a class="plugin-web-update-notice-btn plugin-web-update-notice-refresh-btn">
             refresh
           </a>
         </div>
       </div>
     </div>
   </div>
   ```



## License

[MIT](./LICENSE)
