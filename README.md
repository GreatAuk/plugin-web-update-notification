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
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/discussions" target="__blank">
      <img src="https://img.shields.io/badge/discussions-on%20github-blue?style=flat-square&colorB=51C838" alt="discussions-image" />
    </a>
    <br>
</p>

<p align="center">
  <a href="https://zread.ai/GreatAuk/plugin-web-update-notification" target="_blank"><img src="https://img.shields.io/badge/Ask_Zread-_.svg?style=flat-square&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff" alt="zread"/></a>
  <a href="https://deepwiki.com/GreatAuk/plugin-web-update-notification"><img src="https://img.shields.io/badge/DeepWiki-GreatAuk%2Fplugin--web--update--notification-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==" alt="DeepWiki"></a>
</p>

Detect webpage updates and notify user to reload. support Vite, UmiJS, Webpack and Rspack

> Take the git commit hash (also support svn revision number、package.json version、build timestamp、custom) as the version number, and write version into json file. The client polls the version of the server (visibilitychange or focus event assistant), compares it with the local one, and if it is not the same, notifies the user to refresh the page (you can custom behavior).

<p align="center">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/main/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/main/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/main/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/main/images/react_umi_example.webp">
</p>

**When to check for updates (fetch version.json)** ?

1. first load page.
2. poll (default: 10 * 60 * 1000 ms).
3. script resource loading failure detected (404 ?).
4. when the tab page is refocus or revisible.

**How to see the update notification**

Install the current plugin (using the default configuration), package and deploy it -> Open a browser to visit the webpage (Tab A) -> Modify the code, repackage and redeploy(the default versionType requires a git commit to update the version number.) -> Re-enter the previously opened Tab A. Here you can see the update notification in the lower right corner.
Note that the current plugin will not take effect in development mode.

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

# rspack plugin
pnpm add @plugin-web-update-notification/rspack -D
```

## Usage

[Vite](#vite) | [UmiJS](#umijs) | [Webpack](#webpack) | [Rspack](#rspack)

### Important: Disable `index.html` caching!

If `index.html` is cached, the update notification may still appear after refreshing, so it is necessary to disable the caching of `index.html`. This is also a best practice for deploy SPA applications.

To disable caching through `nginx`:

```nginx
# nginx.conf
location / {
  index index.html index.htm;

  if ( $uri = '/index.html' ) { # disabled index.html cache
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  try_files $uri $uri/ /index.html;
}
```

Directly disable caching through `html meta` tags:

```html
<!DOCTYPE html>
<html lang="en">
<head>

  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />

</head>
</html>
```

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
document.body.addEventListener('plugin_web_update_notice', (e) => {
  const { version, options } = e.detail
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
    versionType: 'git_commit_hash',
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

### Rspack

```js
// rspack.config.js
const { HtmlRspackPlugin } = require('@rspack/core')
const { WebUpdateNotificationPlugin } = require('@plugin-web-update-notification/rspack')

module.exports = {
  plugins: [
    new HtmlRspackPlugin(),
    new WebUpdateNotificationPlugin({
      logVersion: true,
    }),
  ],
}
```

Also works with **Rsbuild**:

```ts
// rsbuild.config.ts
import { defineConfig } from '@rsbuild/core'
import { WebUpdateNotificationPlugin } from '@plugin-web-update-notification/rspack'

export default defineConfig({
  tools: {
    rspack: {
      plugins: [
        new WebUpdateNotificationPlugin({
          logVersion: true,
        }),
      ],
    },
  },
})
```

### suggest: disabled index.html cache

```nginx
# nginx.conf
location / {
  index index.html index.htm;

  if ( $uri = '/index.html' ) { # disabled index.html cache
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }

  try_files $uri $uri/ /index.html;
}
```



## webUpdateNotice Options

```ts
function webUpdateNotice(options?: Options): Plugin

export interface Options {
  /**
   * support 'git_commit_hash' | 'svn_revision_number' | 'pkg_version' | 'build_timestamp' | 'custom'
   * * if repository type is 'Git', default is 'git_commit_hash'
   * * if repository type is 'SVN', default is 'svn_revision_number'
   * * if repository type is 'unknown', default is 'build_timestamp'
   * */
  versionType?: VersionType
  /**
   * custom version, if versionType is 'custom', this option is required
   */
  customVersion?: string
  /** polling interval（ms）
   * if set to 0, it will not polling
   * @default 10 * 60 * 1000
   */
  checkInterval?: number
  /**
   * check update when window focus
   * @default true
   */
  checkOnWindowFocus?: boolean
  /**
   * check update immediately after page loaded
   * @default true
   */
  checkImmediately?: boolean
  /**
   * check update when load js file error
   * @default true
   */
  checkOnLoadFileError?: boolean
  /**
   * whether to output version in console
   *
   * you can also pass a function to handle the version
   * ```ts
   * logVersion: (version) => {
   *  console.log(`version: %c${version}`, 'color: #1890ff') // this is the default behavior
   * }
   * ```
   * @default true
   */
  logVersion?: boolean | ((version: string) => void)
  /**
   * whether to silence the notification.
   * such as when local version is v1.0, you can set this option to true and build a new version v1.0.1, then the notification will not show
   */
  silence?: boolean
  /**
   * @deprecated
   */
  customNotificationHTML?: string
  /** notificationProps have higher priority than locale */
  notificationProps?: NotificationProps
  notificationConfig?: NotificationConfig
  /**
   * preset: zh_CN | zh_TW | en_US
   * @default 'zh_CN'
   * */
  locale?: string
  /**
   * custom locale data
   * @link default data: https://github.com/GreatAuk/plugin-web-update-notification/blob/main/packages/core/src/locale.ts
   */
  localeData?: LocaleData
  /**
   * Whether to hide the default notification, if you set it to true, you need to custom behavior by yourself
   * ```ts
    document.body.addEventListener('plugin_web_update_notice', (e) => {
      const { version, options } = e.detail
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
   * After version 1.2.0, you not need to set this option, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config
   *
   * Base public path for inject file, Valid values include:
   * * Absolute URL pathname, e.g. /foo/
   * * Full URL, e.g. https://foo.com/
   * * Empty string(default) or ./
   *
   * !!! Don't forget / at the end of the path
  */
  injectFileBase?: string
}

export type VersionType = 'git_commit_hash' | 'pkg_version' | 'build_timestamp' | 'custom'

export interface NotificationConfig {
  /**
   * refresh button color
   * @default '#1677ff'
  */
  primaryColor?: string
  /**
   * dismiss button color
   * @default 'rgba(0,0,0,.25)'
  */
  secondaryColor?: string
  /** @default 'bottomRight' */
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
}

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

## export Functions
| name                                            | params                              | describe                                                     |
| ----------------------------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| window.pluginWebUpdateNotice_.setLocale         | locale(preset: zh_CN、zh_TW、en_US) | set locale                                                   |
| window.pluginWebUpdateNotice_.closeNotification |                                     | close notification                                           |
| window.pluginWebUpdateNotice_.dismissUpdate     |                                     | dismiss current update and close notification,same behavior as dismiss button |
| window.pluginWebUpdateNotice_.checkUpdate       |                                     | manual check update, a function wrap by debounce(5000ms)     |
```ts
interface Window {
  pluginWebUpdateNotice_: {
    /**
       * set language.
       * preset: zh_CN、zh_TW、en_US
      */
    setLocale: (locale: string) => void
    /**
     * manual check update, a function wrap by debounce(5000ms)
     */
    checkUpdate: () => void
    /** dismiss current update and close notification, same behavior as dismiss the button */
    dismissUpdate: () => void
    /** close notification */
    closeNotification: () => void
    /**
     * refresh button click event, if you set it, it will cover the default event (location.reload())
     */
    onClickRefresh?: (version: string) => void
    /**
     * dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
     */
    onClickDismiss?: (version: string) => void
  }
}
```

## What was changed

![inject_content](https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/main/images/inject_content.webp)

## Q&A

1. `TypeScript` intellisense, if you use `window.pluginWebUpdateNotice_.` or listener custom update event。

   ```ts
   // src/shim.d.ts

   // if you use vite plugin
   /// <reference types="@plugin-web-update-notification/vite" />

   // if you use umi plugin
   /// <reference types="@plugin-web-update-notification/umijs" />

   // if you use webpack plugin
   /// <reference types="@plugin-web-update-notification/webpack" />
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

   > After version 1.2.0, in most case, you not need to set injectFileBase, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config

3. Custom notification button event.

   ```ts
   // refresh button click event, if you set it, it will cover the default event (location.reload())
   window.pluginWebUpdateNotice_.onClickRefresh = (version) => { alert(`click refresh btn: ${version}`) }

   // dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
   window.pluginWebUpdateNotice_.onClickDismiss = (version) => { alert(`click dismiss btn: ${version}`) }
   ```

4. Custom notification style.

   you can cover css styles with higher weights. ([default css file](https://github.com/GreatAuk/plugin-web-update-notification/blob/main/packages/core/public/webUpdateNoticeInjectStyle.css))

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

5. manual check update.

   ```ts
   // vue-router check update before each route change
   router.beforeEach((to, from, next) => {
     window.pluginWebUpdateNotice_.checkUpdate()
     next()
   })
   ```

6. Some versions do not notify. For example, if the customer version is `v1.0`, you need to update to `v1.0.1`, but do not want to display the update prompt.

   ```ts
   webUpdateNotice({
     ...
     silence: true
   })
   ```

## License

[MIT](./LICENSE)
