[English](./README.md) | 简体中文

# vite-plugin-web-update-notification
<p align="center">
    <a href="https://unpkg.com/browse/vite-plugin-web-update-notification/dist/webUpdateNoticeInjectScript.js">
      <img src="https://img.badgesize.io/https://unpkg.com/vite-plugin-web-update-notification/dist/webUpdateNoticeInjectScript.js?compression=gzip&style=flat-square" alt="Gzip Size" />
    </a>
    <a href="https://www.npmjs.com/package/vite-plugin-web-update-notification">
      <img src="https://img.shields.io/npm/v/vite-plugin-web-update-notification.svg?style=flat-square&colorB=51C838" alt="NPM Version" />
    </a>
    <a href="https://github.com/GreatAuk/vite-plugin-web-update-notification/blob/master/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/GreatAuk/vite-plugin-web-update-notification/discussions">
      <img src="https://img.shields.io/badge/discussions-on%20github-blue?style=flat-square&colorB=51C838" alt="discussions-image" />
    </a>
    <br>
</p>

检测网页更新并通知用户刷新

> 以 git commit hash 为版本号。客户端轮询服务器（visibilitychange 事件辅助）的 git commit hash , 和本地作比较，如果不相同则通知用户刷新页面。

![vue](https://utopia1994.oss-cn-shanghai.aliyuncs.com/img-bed/202206211607688.webp)

------

![react](https://utopia1994.oss-cn-shanghai.aliyuncs.com/img-bed/202206211607683.webp)

## Why
部分用户（老板）没有关闭网页的习惯，如果前端页面有更新的话，用户页面可能会出现报错（文件404）或白屏的情况。



## 安装

```bash
npm add vite-plugin-web-update-notification -D
# yarn add vite-plugin-web-update-notification -D
# pnpm add vite-plugin-web-update-notification -D
```

## 快速上手

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { webUpdateNotice } from 'vite-plugin-web-update-notification'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logHash: true,
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
document.body.addEventListener('system_update_vite_plugin_web_update_notification', (options) => {
  console.log(options)
  alert('System update!')
})
```



## Options

```ts
function webUpdateNotice(options?: Options): Plugin

interface Options {
  /** 轮询间隔（ms）, 默认 10*60*1000 */
  checkInterval?: number
  /** 是否在浏览器控制台输出 commit-hash */
  logHash?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
}

interface NotificationProps {
  title?: string
  description?: string
  buttonText?: string
}
```

## License

[MIT](./LICENSE)
