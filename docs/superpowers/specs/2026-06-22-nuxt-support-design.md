# 设计：`@plugin-web-update-notification/nuxt`

- 日期：2026-06-22
- 状态：已确认，待实现
- 范围：核心 module 包 + 文档/README（不含 example、测试）

## 背景与目标

为 plugin-web-update-notification 增加 Nuxt 支持，使 Nuxt 项目能像 Vite/Umi/Webpack/Rspack 一样检测网页更新并通知用户刷新。

核心原理不变：构建时把版本号写入 `version.json`，注入检测脚本与样式，客户端轮询服务器版本号并与本地比较，不同则通知刷新。

### 硬需求

- **覆盖全部部署模式**：SSG（`nuxt generate`）、SPA（`ssr: false`）、SSR（`nuxt build` + 运行时渲染）。
- **仅支持 Nuxt 3+（含 Nuxt 4）**，不兼容 Nuxt 2 / Bridge。

## 架构决策

新建独立子包 `@plugin-web-update-notification/nuxt`，以标准 **Nuxt Module**（`defineNuxtModule`）实现，复用 `@plugin-web-update-notification/core` 的全部核心能力。

### 为什么不复用 vite 插件

现有 `@plugin-web-update-notification/vite` 依赖 Vite 的 `apply:'build'` + `transformIndexHtml` + `generateBundle`。在 Nuxt **SSR 模式下这些钩子不参与 Nitro 的 HTML 渲染与资源产出**，HTML 由 Nitro 在运行时渲染、静态资源由 Nitro 产出，因此无法满足「全模式」要求。SSG 下也容易与 Nuxt 的 HTML 处理冲突。

被否决的替代方案：

- **方案 B（仅文档教用户把 vite 插件塞进 `nuxt.config.vite.plugins`）**：SSR 下根本不触发，排除。
- **方案 C（在 vite 包内加 `/nuxt` 子入口）**：职责混杂、引入 `@nuxt/kit` 依赖，且与仓库「一框架一包」（umijs/webpack/rspack 各自独立）的结构不一致，排除。

## 包结构

```
packages/nuxt/
  package.json          # name: @plugin-web-update-notification/nuxt
  tsdown.config.ts      # 与其他包一致，tsdown 构建 ESM
  src/
    index.ts            # defineNuxtModule 主体
  README.md
```

- `dependencies`: `@plugin-web-update-notification/core: workspace:*`
- `peerDependencies`: `nuxt: ^3.0.0 || ^4.0.0`
- `devDependencies`: `@nuxt/kit`、`nuxt`
- 构建产物：`dist/index.mjs` + `dist/index.d.mts`（ESM，Nuxt module 标准形态），`exports` 字段与 vite 包对齐
- turbo / pnpm workspace 自动纳入 `pnpm build`、`pnpm typecheck`

## 运行机制（复用 core，三模式统一）

模块 `setup(options, nuxt)` 流程：

1. **仅生产构建生效**：`if (nuxt.options.dev) return`（对应 vite 的 `apply:'build'`、umi 的 `api.env === 'production'`）。
2. **取版本号**：复用 core 的 `getVersion(versionType, customVersion)`，逻辑与 vite/umi 一致；取不到则提前返回。
3. **生成注入内容**：用 `get__Dirname()` 从 core dist 读取 `inject.js` / `inject.css` 源码，`generateJsFileContent` 生成脚本，`getFileHash` 算出 `jsFileHash` / `cssFileHash`（与现有包同一套常量与函数）。
4. **`injectFileBase` 默认值**：取 `nuxt.options.app.baseURL`（Nuxt 中对应 vite 的 `base` / umi 的 `publicPath`），用户可显式覆盖。
5. **注入 head 标签**（unhead，三模式都生效）：
   - 往 `nuxt.options.app.head.script` 推 `<script data-id="${INJECT_SCRIPT_TAG_ID}" data-v="${version}" src="${injectFileBase}${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js">`，用 unhead 的 `tagPriority` 保证尽量靠前。
   - 往 `head.link` 推 stylesheet（`href` 指向 `${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`）；当 `customNotificationHTML` 或 `hiddenDefaultNotification` 为真时跳过。
6. **注入通知锚点 div**（body）：通过 Nitro 的 `render:html` hook 向 `html.bodyAppend` 追加 `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`，覆盖 SSR / SSG / SPA 三种产出的 HTML；`hiddenDefaultNotification` 为真时跳过。
   - 决策：采用服务端渲染时即带上锚点的方式（最贴近 vite/umi 行为），而非「client plugin 启动时 append」。
7. **产出静态资源**：挂 Nitro `nitro:build:public-assets` hook，把以下文件写入 `nitro.options.output.publicDir/${DIRECTORY_NAME}/`：
   - `version.json`（`generateJSONFileContent(version, silence)`）
   - `inject.${jsFileHash}.js`
   - `inject.${cssFileHash}.css`（`hiddenDefaultNotification` 时跳过）

   三种模式下 Nitro 都从 publicDir 提供静态文件，客户端轮询路径 `${injectFileBase}${DIRECTORY_NAME}/version.json` 一致。

### 关键点

head 注入走 unhead、静态资源走 Nitro publicDir、body 锚点走 Nitro `render:html`——这三条路径在 SSG / SPA / SSR 下均成立，这正是「不能直接复用 vite 插件」的根因。

## 配置与类型

- `defineNuxtModule` 的 `meta.configKey = 'webUpdateNotification'`，用户可在 `nuxt.config.ts` 顶层写 `webUpdateNotification: {...}`（与 umi 的 key 对齐），或 `modules: [['@plugin-web-update-notification/nuxt', {...}]]`。
- 配置类型直接复用 core 的 `Options`，并 `export type { Options }`。
- 对 `NuxtConfig` / `NuxtOptions` 做模块类型增强，使 `webUpdateNotification` 有类型提示。
- 保留 `window.pluginWebUpdateNotice_` 的类型提示用法：`/// <reference types="@plugin-web-update-notification/nuxt" />`。

## 文档

- 新增 `packages/nuxt/README.md`：安装、`modules` 接入、配置项、三模式说明。
- 更新根 `README.md`（及对应的 zh-CN 等本地化 README 若存在）：在框架支持列表加入 Nuxt，给出最小接入示例。

## 本轮不做（Out of Scope）

- `example/nuxt` 示例项目
- E2E / 单元测试
- Nuxt 2 / Bridge 兼容
