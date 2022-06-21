English | [简体中文](./README.zh-CN.md)

# vite-plugin-web-update-notification

Detect web page updates and notify.

> Take the git commit hash as the version number. The client polls the git commit hash of the server (visibilitychange event assistant), compares it with the local one, and if it is not the same, notifies the user to refresh the page.

<img src="./images/example.webp" style="border: 1px solid #ccc; border-radius: 4px;" />

## Why

Some users do not have the habit of closing web pages. If the front-end page is updated, the user page may report an error (file 404) or a white screen.



## Install

```bash
npm add vite-plugin-web-update-notification -D
# yarn add vite-plugin-web-update-notification -D
# pnpm add vite-plugin-web-update-notification -D
```

## Usage

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
document.body.addEventListener('system_update_vite_plugin_web_update_notification', (options) => {
  console.log(options)
  alert('System update!')
})
```



## Options

```ts
function webUpdateNotice(options?: Options): Plugin

interface Options {
  /** polling interval（ms）, default 10*60*1000 */
  checkInterval?: number
  /** whether to output commit-hash in console */
  logHash?: boolean
  customNotificationHTML?: string
  notificationProps?: NotificationProps
  hiddenDefaultNotification?: boolean
}

interface NotificationProps {
  title?: string
  description?: string
  buttonText?: string
}
```



## License

[MIT](./LICENSE)
