[English](./README.md) | 简体中文

# plugin-web-update-notification
<p align="center">
    <a href="https://unpkg.com/@plugin-web-update-notification/core@0.3.0/dist/webUpdateNoticeInjectScript.js">
      <img src="https://img.badgesize.io/https://unpkg.com/@plugin-web-update-notification/core@0.3.0/dist/webUpdateNoticeInjectScript.js?compression=gzip&style=flat-square" alt="Gzip Size" />
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

检测网页更新并通知用户刷新，支持 vite、umijs 和 webpack 插件。

> 以 git commit hash ( 如果不是一个 git 仓库，使用打包时的时间戳) 为版本号，打包时将版本号写入 json 文件。客户端轮询服务器上的版本号（窗口的 visibilitychange 事件做辅助）, 和本地作比较，如果不相同则通知用户刷新页面。

<p align="center">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_umi_example.webp">
</p>
**什么时候会检测更新 (fetch version.json)** ?

1. 首次加载页面。
2. 轮询 （default: 10 * 60 * 1000 ms）。
3. script 脚本资源加载失败 (404 ?)。
4. visibilitychange event get visible。

## Why

部分用户（老板）没有关闭网页的习惯，如果前端页面有更新的话，用户页面可能会出现报错（文件404）或白屏的情况。

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
      // 自定义通知栏文本
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
      // 自定义 notification UI
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
document.body.addEventListener('system_update_plugin_web_update_notification', (options) => {
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
  /** 轮询间隔（ms）, 默认 10*60*1000 */
  checkInterval?: number
  /** 是否在浏览器控制台输出 commit-hash */
  logVersion?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
  /** index.html file path, by default, we will look up path.resolve(webpackOutputPath, './index.html') */
  indexHtmlFilePath?: string // only webpack plugin support

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
}
```

## License

[MIT](./LICENSE)
