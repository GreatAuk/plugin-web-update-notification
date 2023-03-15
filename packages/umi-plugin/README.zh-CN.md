

[English](./README.md) | 简体中文

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

检测网页更新并通知用户刷新，支持 vite、umijs 和 webpack 插件。

> 以 git commit hash (也支持 svn revision number、package.json version、build timestamp、custom) 为版本号，打包时将版本号写入 json 文件。客户端轮询服务器上的版本号（浏览器窗口的 visibilitychange、focus 事件辅助），和本地作比较，如果不相同则通知用户刷新页面。

<p align="center">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_umi_example.webp">
</p>
**什么时候会检测更新(fetch version.json)**  ?

1. 首次加载页面。
2. 轮询 （default: 10 * 60 * 1000 ms）。
3. script 脚本资源加载失败 (404 ?)。
4. 标签页 refocus or revisible。

## Why

部分用户（老板）没有关闭网页的习惯，在网页有新版本更新或问题修复时，用户继续使用旧的版本，影响用户体验和后端数据准确性。也有可能会出现报错（文件404）、白屏的情况。

## 安装

```bash
# vite
pnpm add @plugin-web-update-notification/vite -D

# umijs
pnpm add @plugin-web-update-notification/umijs -D

# webpack plugin
pnpm add @plugin-web-update-notification/webpack -D
```

## 快速上手

[vite](#vite) | [umi](#umijs) | [webpack](#webpack)

### Vite

**基础使用**

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

**自定义通知栏文本**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      notificationProps: {
        title: '标题',
        description: 'System update, please refresh the page',
        buttonText: '刷新',
        dismissButtonText: '忽略'
      },
    }),
  ]
})
```

**国际化**

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

```ts
// 取消默认的通知栏，监听更新事件自定义行为
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      hiddenDefaultNotification: true
    }),
  ]
})

// 在其他文件中监听自定义更新事件
document.body.addEventListener('plugin_web_update_notice', ({ options, version }) => {
  console.log(options)
  // write some code, show your custom notification and etc.
  alert('System update!')
})
```

### Umijs

不支持 `umi2`, `umi2` 可以尝试下通过 `chainWebpack` 配置 `webpack` 插件。

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
  /** whether to output version in console */
  logVersion?: boolean
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
   * @link default data: https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/src/locale.ts
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

## 曝露的方法

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

## 变动了哪些内容

![inject_content](https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/inject_content.webp)

## Q&A

1. `TypeScript` 的智能提示, 如果你想使用 `window.pluginWebUpdateNotice_.` 或监听自定义更新事件。

   ```ts
   // src/shim.d.ts
   
   // if you use vite plugin
   /// <reference types="@plugin-web-update-notification/vite" />
   
   // if you use umi plugin
   /// <reference types="@plugin-web-update-notification/umijs" />
   
   // if you use webpack plugin
   /// <reference types="@plugin-web-update-notification/webpack" />
   ```

2. 请求 `version.json` 文件提示 `404 error`。

   上传打包内容到 cdn 服务器：

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

   在非根目录下部署的项目：

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

   > After version 1.2.0, you not need to set this option, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config

3. 自定义 `notification` 的刷新和忽略按钮事件。

   ```ts
   // refresh button click event, if you set it, it will cover the default event (location.reload())
   window.pluginWebUpdateNotice_.onClickRefresh = (version) => { alert(`click refresh btn: ${version}`) }

   // dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
   window.pluginWebUpdateNotice_.onClickDismiss = (version) => { alert(`click dismiss btn: ${version}`) }
   ```

4. 自定义 notification 样式。

   你可以通过更高的权重覆盖默认样式。([default css file](https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/public/webUpdateNoticeInjectStyle.css))

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

5. 手动检测更新

   ```ts
   // vue-router check update before each route change
   router.beforeEach((to, from, next) => {
     window.pluginWebUpdateNotice_.checkUpdate()
     next()
   })
   ```



## 文章
* https://juejin.cn/post/7209234917288886331


## License

[MIT](./LICENSE)
