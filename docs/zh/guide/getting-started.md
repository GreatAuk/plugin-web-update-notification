# Getting-Started

## 必要的配置

### 关键：禁用 `index.html` 缓存！！！

如果 `index.html` 存在缓存，可能刷新后，更新提示还会存在，所以需要禁用 `index.html` 的缓存。这也是 `SPA` 应用部署的一个最佳实践吧。

通过 `nginx` ，禁用缓存：

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

直接通过 `html meta` 标签禁用缓存：

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

## 安装

```bash
# vite
pnpm add @plugin-web-update-notification/vite -D

# umijs
pnpm add @plugin-web-update-notification/umijs -D

# webpack plugin
pnpm add @plugin-web-update-notification/webpack -D
```

## 基础使用

### Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "@plugin-web-update-notification/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logVersion: true,
    }),
  ],
});
```

### Umijs

```ts
// .umirc.ts
import { defineConfig } from "umi";
import type { Options as WebUpdateNotificationOptions } from "@plugin-web-update-notification/umijs";

export default {
  plugins: ["@plugin-web-update-notification/umijs"],
  webUpdateNotification: {
    logVersion: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: "system update",
      description: "System update, please refresh the page",
      buttonText: "refresh",
      dismissButtonText: "dismiss",
    },
  } as WebUpdateNotificationOptions,
};
```

### Webpack

```js
// vue.config.js(vue-cli project)
const {
  WebUpdateNotificationPlugin,
} = require("@plugin-web-update-notification/webpack");
const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  // ...other config
  configureWebpack: {
    plugins: [
      new WebUpdateNotificationPlugin({
        logVersion: true,
      }),
    ],
  },
});
```
