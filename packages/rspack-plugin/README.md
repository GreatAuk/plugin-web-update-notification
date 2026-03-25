# @plugin-web-update-notification/rspack

Rspack plugin for detecting web page updates and notifying users.

## Install

```bash
pnpm add @plugin-web-update-notification/rspack -D
```

## Usage

```js
// rspack.config.js
const { HtmlRspackPlugin } = require('@rspack/core');
const { WebUpdateNotificationPlugin } = require('@plugin-web-update-notification/rspack');

module.exports = {
  plugins: [
    new HtmlRspackPlugin(),
    new WebUpdateNotificationPlugin({
      // options
    }),
  ],
};
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `versionType` | `string` | auto detect | Support `git_commit_hash`, `svn_revision_number`, `pkg_version`, `build_timestamp`, `custom` |
| `customVersion` | `string` | - | Required when `versionType` is `custom` |
| `checkInterval` | `number` | `10 * 60 * 1000` | Polling interval in ms. Set to 0 to disable polling |
| `checkOnWindowFocus` | `boolean` | `true` | Check update when window focus |
| `checkImmediately` | `boolean` | `true` | Check update immediately after page loaded |
| `checkOnLoadFileError` | `boolean` | `true` | Check update when load js file error |
| `logVersion` | `boolean \| function` | `true` | Whether to output version in console |
| `silence` | `boolean` | `false` | Whether to silence the notification |
| `hiddenDefaultNotification` | `boolean` | `false` | Whether to hide the default notification |
| `hiddenDismissButton` | `boolean` | `false` | Whether to hide the dismiss button |
| `injectFileBase` | `string` | auto detect | Base public path for inject file |
| `locale` | `string` | `zh_CN` | Preset locale: `zh_CN`, `zh_TW`, `en_US` |
| `indexHtmlFilePath` | `string` | `./index.html` | Fallback HTML file path (used when HtmlRspackPlugin is not available) |

## Custom Notification

```js
new WebUpdateNotificationPlugin({
  hiddenDefaultNotification: true,
})
```

Then listen to the custom event:

```js
document.body.addEventListener('plugin_web_update_notice', (e) => {
  const { version, options } = e.detail
  // show your custom notification
  alert('System update!')
})
```
