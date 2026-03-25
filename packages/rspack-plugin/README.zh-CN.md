# @plugin-web-update-notification/rspack

检测网页更新并通知用户刷新的 Rspack 插件。

## 安装

```bash
pnpm add @plugin-web-update-notification/rspack -D
```

## 使用

```js
// rspack.config.js
const { HtmlRspackPlugin } = require('@rspack/core')
const { WebUpdateNotificationPlugin } = require('@plugin-web-update-notification/rspack')

module.exports = {
  plugins: [
    new HtmlRspackPlugin(),
    new WebUpdateNotificationPlugin({
      // 配置选项
    }),
  ],
}
```

## 配置项

| 选项                        | 类型                  | 默认值           | 说明                                                                                      |
| --------------------------- | --------------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| `versionType`               | `string`              | 自动检测         | 支持 `git_commit_hash`、`svn_revision_number`、`pkg_version`、`build_timestamp`、`custom` |
| `customVersion`             | `string`              | -                | 当 `versionType` 为 `custom` 时必填                                                       |
| `checkInterval`             | `number`              | `10 * 60 * 1000` | 轮询间隔（毫秒），设为 0 禁用轮询                                                         |
| `checkOnWindowFocus`        | `boolean`             | `true`           | 窗口获得焦点时检查更新                                                                    |
| `checkImmediately`          | `boolean`             | `true`           | 页面加载后立即检查更新                                                                    |
| `checkOnLoadFileError`      | `boolean`             | `true`           | 加载 js 文件失败时检查更新                                                                |
| `logVersion`                | `boolean \| function` | `true`           | 是否在控制台输出版本号                                                                    |
| `silence`                   | `boolean`             | `false`          | 是否静默通知                                                                              |
| `hiddenDefaultNotification` | `boolean`             | `false`          | 是否隐藏默认通知                                                                          |
| `hiddenDismissButton`       | `boolean`             | `false`          | 是否隐藏关闭按钮                                                                          |
| `injectFileBase`            | `string`              | 自动检测         | 注入文件的基础路径                                                                        |
| `locale`                    | `string`              | `zh_CN`          | 预设语言：`zh_CN`、`zh_TW`、`en_US`                                                       |
| `indexHtmlFilePath`         | `string`              | `./index.html`   | 备用 HTML 文件路径（未使用 HtmlRspackPlugin 时使用）                                      |

## 自定义通知

```js
new WebUpdateNotificationPlugin({
  hiddenDefaultNotification: true,
})
```

然后监听自定义事件：

```js
document.body.addEventListener('plugin_web_update_notice', (e) => {
  const { version, options } = e.detail
  // 展示你的自定义通知
  alert('系统更新！')
})
```
