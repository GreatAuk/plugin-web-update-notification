# Webpack

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