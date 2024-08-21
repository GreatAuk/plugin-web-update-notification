# Getting-Started

## Preset

### Important: Disable `index.html` caching

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
    <meta
      http-equiv="Cache-Control"
      content="no-cache, no-store, must-revalidate"
    />
    <meta http-equiv="Pragma" content="no-cache" />
    <meta http-equiv="Expires" content="0" />
  </head>
</html>
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

## Install

```bash
# vite
pnpm add @plugin-web-update-notification/vite -D

# umijs
pnpm add @plugin-web-update-notification/umijs -D

# webpack plugin
pnpm add @plugin-web-update-notification/webpack -D
```

## Basic Usage

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
