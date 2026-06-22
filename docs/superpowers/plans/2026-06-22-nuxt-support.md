# Nuxt Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `@plugin-web-update-notification/nuxt` 子包，以 Nuxt Module 形式为 Nuxt 3+ 项目提供网页更新检测与通知，覆盖 SSG / SPA / SSR 三种部署模式。

**Architecture:** 用 `@nuxt/kit` 的 `defineNuxtModule` 实现标准 Nuxt module，复用 `@plugin-web-update-notification/core` 的版本获取、注入脚本生成、文件 hash 等能力。HTML head 注入走 unhead（`nuxt.options.app.head`），body 通知锚点走 Nitro `render:html` hook，静态资源（version.json / inject.js / inject.css）写入 Nitro `publicDir`——这三条路径在三种模式下均成立。

**Tech Stack:** TypeScript、`@nuxt/kit`、Nuxt 3/4（Nitro）、tsdown（构建）、pnpm workspace + turbo。

## Global Constraints

- 仅支持 Nuxt 3+：`peerDependencies.nuxt = "^3.0.0 || ^4.0.0"`，不兼容 Nuxt 2 / Bridge。
- 仅在生产构建生效：`if (nuxt.options.dev) return`。
- 复用 core 的常量与函数，**不得**在 nuxt 包内重新定义：`DIRECTORY_NAME='pluginWebUpdateNotice'`、`JSON_FILE_NAME='web_version_by_plugin'`、`INJECT_STYLE_FILE_NAME='webUpdateNoticeInjectStyle'`、`INJECT_SCRIPT_FILE_NAME='webUpdateNoticeInjectScript.iife'`、`INJECT_SCRIPT_TAG_ID='_pwun_'`、`NOTIFICATION_ANCHOR_CLASS_NAME='plugin-web-update-notice-anchor'`。
- 注入文件随 core dist 发布，路径用 core 的 `get__Dirname()` 解析：脚本源码 `${INJECT_SCRIPT_FILE_NAME}.js`、样式源码 `${INJECT_STYLE_FILE_NAME}.css`。
- 输出文件名带内容 hash：`${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`、`${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`。
- 客户端轮询路径必须为 `${injectFileBase}${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`，`injectFileBase` 默认取 `nuxt.options.app.baseURL`。
- 配置 key：`webUpdateNotification`（与 umi 对齐）。
- 构建用 tsdown，仅输出 ESM（Nuxt module 为 ESM）。
- 本轮 scope **不含**：example 项目、E2E/单元测试、Nuxt 2 兼容。因无测试，每个任务的验证为「目标包 build 成功 + 根 `pnpm typecheck` 通过」。

---

## File Structure

- `packages/nuxt/package.json` — 包元信息、依赖、exports、scripts。
- `packages/nuxt/tsdown.config.ts` — tsdown 构建配置（ESM + dts）。
- `packages/nuxt/src/index.ts` — Nuxt module 主体（唯一逻辑文件）+ 类型增强 + 导出。
- `packages/nuxt/README.md` — 包文档。
- `package.json`（根）— 新增 `dev:nuxt` 脚本。
- `README.md` / `README.zh-CN.md`（根）— 框架支持列表与 Usage 加入 Nuxt。

---

## Task 1: 搭建 `packages/nuxt` 包骨架

**Files:**
- Create: `packages/nuxt/package.json`
- Create: `packages/nuxt/tsdown.config.ts`
- Create: `packages/nuxt/src/index.ts`（临时最小占位，Task 2 填充）
- Modify: `package.json`（根，新增 `dev:nuxt` 脚本）

**Interfaces:**
- Consumes: 无（首个任务）。
- Produces: 可被 pnpm workspace 识别的包 `@plugin-web-update-notification/nuxt`，依赖 `@plugin-web-update-notification/core: workspace:*`，可执行 `pnpm --filter @plugin-web-update-notification/nuxt build`。

- [ ] **Step 1: 创建 `packages/nuxt/package.json`**

```json
{
  "name": "@plugin-web-update-notification/nuxt",
  "version": "2.1.1",
  "description": "Nuxt module for detect web page updates and notify.",
  "keywords": [
    "@plugin-web-update-notification/nuxt",
    "nuxt",
    "nuxt-module",
    "web-update-notification"
  ],
  "homepage": "https://github.com/GreatAuk/plugin-web-update-notification",
  "bugs": {
    "url": "https://github.com/GreatAuk/plugin-web-update-notification/issues"
  },
  "license": "MIT",
  "author": "Utopia",
  "repository": {
    "type": "git",
    "url": "https://github.com/GreatAuk/plugin-web-update-notification",
    "directory": "packages/nuxt"
  },
  "files": [
    "dist"
  ],
  "type": "module",
  "sideEffects": false,
  "main": "dist/index.mjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.mts",
  "exports": {
    ".": {
      "types": "./dist/index.d.mts",
      "import": "./dist/index.mjs",
      "default": "./dist/index.mjs"
    }
  },
  "scripts": {
    "dev": "tsdown --watch",
    "build": "tsdown"
  },
  "dependencies": {
    "@plugin-web-update-notification/core": "workspace:*",
    "@nuxt/kit": "^3.0.0"
  },
  "devDependencies": {
    "nuxt": "^3.0.0"
  },
  "peerDependencies": {
    "nuxt": "^3.0.0 || ^4.0.0"
  }
}
```

> 说明：`@nuxt/kit` 放 `dependencies`（module 运行期依赖 kit 的 `defineNuxtModule`），`nuxt` 仅作 peer + dev。

- [ ] **Step 2: 创建 `packages/nuxt/tsdown.config.ts`**

```ts
import { defineConfig } from 'tsdown'

export default defineConfig((options) => {
  return {
    entry: {
      index: 'src/index.ts',
    },
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm'],
    minify: !options.watch,
  }
})
```

- [ ] **Step 3: 创建临时占位 `packages/nuxt/src/index.ts`**

```ts
import { defineNuxtModule } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: '@plugin-web-update-notification/nuxt',
    configKey: 'webUpdateNotification',
  },
  setup() {},
})
```

- [ ] **Step 4: 根 `package.json` 新增 `dev:nuxt` 脚本**

在 `dev:webpack` 一行后加入（保持现有缩进与逗号）：

```json
    "dev:nuxt": "pnpm --filter=@plugin-web-update-notification/nuxt dev",
```

- [ ] **Step 5: 安装依赖并构建占位包**

Run: `pnpm install && pnpm --filter @plugin-web-update-notification/nuxt build`
Expected: 安装成功，`packages/nuxt/dist/index.mjs` 与 `index.d.mts` 生成，无报错。

- [ ] **Step 6: Commit**

```bash
git add packages/nuxt/package.json packages/nuxt/tsdown.config.ts packages/nuxt/src/index.ts package.json pnpm-lock.yaml
git commit -m "feat(nuxt): scaffold @plugin-web-update-notification/nuxt package"
```

---

## Task 2: 实现 Nuxt module 主体逻辑

**Files:**
- Modify: `packages/nuxt/src/index.ts`（替换 Task 1 的占位实现）

**Interfaces:**
- Consumes（来自 core，已发布的导出）：
  - `getVersion(): string` / `getVersion('custom', customVersion: string): string` / `getVersion(versionType): string`
  - `generateJsFileContent(fileSource: string, version: string, options: Options): string`
  - `generateJSONFileContent(version: string, silence?: boolean): string`
  - `getFileHash(fileString: string): string`（返回 MD5 前 8 位）
  - `get__Dirname(): string`（解析到 core dist 目录）
  - 常量：`DIRECTORY_NAME`、`JSON_FILE_NAME`、`INJECT_STYLE_FILE_NAME`、`INJECT_SCRIPT_FILE_NAME`、`INJECT_SCRIPT_TAG_ID`、`NOTIFICATION_ANCHOR_CLASS_NAME`
  - 类型：`Options`
- Consumes（来自 `@nuxt/kit`）：`defineNuxtModule`。
- Produces：默认导出的 Nuxt module；`export type { Options }`；对 `@nuxt/schema` 的 `NuxtConfig` / `NuxtOptions` 增强 `webUpdateNotification?: Options`。

- [ ] **Step 1: 用完整实现替换 `packages/nuxt/src/index.ts`**

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import type { Options } from '@plugin-web-update-notification/core'
import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_SCRIPT_TAG_ID,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  generateJSONFileContent,
  generateJsFileContent,
  getFileHash,
  getVersion,
  get__Dirname,
} from '@plugin-web-update-notification/core'

export type { Options } from '@plugin-web-update-notification/core'

export default defineNuxtModule<Options>({
  meta: {
    name: '@plugin-web-update-notification/nuxt',
    configKey: 'webUpdateNotification',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {},
  setup(options, nuxt) {
    // 仅生产构建生效
    if (nuxt.options.dev) return

    const { versionType, customVersion, silence } = options

    let version = ''
    if (versionType === 'custom') version = getVersion(versionType, customVersion!)
    else version = getVersion(versionType!)

    // 取不到版本号则不启用
    if (!version) return

    // injectFileBase 默认取 Nuxt 的 baseURL
    if (options.injectFileBase === undefined)
      options.injectFileBase = nuxt.options.app.baseURL || '/'

    const { customNotificationHTML, hiddenDefaultNotification, injectFileBase = '/' } = options

    // 从 core dist 读取注入脚本与样式源码
    const coreDir = get__Dirname()

    const jsFileSource = generateJsFileContent(
      readFileSync(`${resolve(coreDir, INJECT_SCRIPT_FILE_NAME)}.js`, 'utf8').toString(),
      version,
      options,
    )
    const jsFileHash = getFileHash(jsFileSource)

    const cssFileSource = readFileSync(
      `${resolve(coreDir, INJECT_STYLE_FILE_NAME)}.css`,
      'utf8',
    ).toString()
    const cssFileHash = getFileHash(cssFileSource)

    const jsFileName = `${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`
    const cssFileName = `${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`
    const jsonFileName = `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`

    const showDefaultNotification = !customNotificationHTML && !hiddenDefaultNotification

    // 1) 注入 head 标签（unhead，SSG/SPA/SSR 都生效）
    nuxt.options.app.head = nuxt.options.app.head || {}
    nuxt.options.app.head.script = nuxt.options.app.head.script || []
    nuxt.options.app.head.link = nuxt.options.app.head.link || []

    nuxt.options.app.head.script.push({
      'src': `${injectFileBase}${jsFileName}`,
      'data-id': INJECT_SCRIPT_TAG_ID,
      'data-v': version,
      'tagPriority': 'high',
    })

    if (showDefaultNotification) {
      nuxt.options.app.head.link.push({
        rel: 'stylesheet',
        href: `${injectFileBase}${cssFileName}`,
      })
    }

    // 2) 注入 body 通知锚点（Nitro render:html，覆盖三模式渲染产物）
    if (!hiddenDefaultNotification) {
      nuxt.hook('nitro:init', (nitro) => {
        nitro.hooks.hook('render:html', (html) => {
          html.bodyAppend.push(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`)
        })
      })
    }

    // 3) 产出静态资源到 Nitro publicDir
    nuxt.hook('nitro:build:public-assets', (nitro) => {
      const publicDir = nitro.options.output.publicDir

      writeFileSafe(resolve(publicDir, jsonFileName), generateJSONFileContent(version, silence))
      writeFileSafe(resolve(publicDir, jsFileName), jsFileSource)
      if (showDefaultNotification)
        writeFileSafe(resolve(publicDir, cssFileName), cssFileSource)
    })
  },
})

function writeFileSafe(filePath: string, content: string) {
  // eslint-disable-next-line ts/no-require-imports, @typescript-eslint/no-var-requires
  const { mkdirSync, writeFileSync } = require('node:fs')
  const { dirname } = require('node:path')
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    webUpdateNotification?: Options
  }
  interface NuxtOptions {
    webUpdateNotification?: Options
  }
}
```

> 实现要点：
> - `tagPriority: 'high'` 让检测脚本在 head 中尽量靠前。
> - body 锚点用 Nitro `render:html` 的 `bodyAppend`，SSR 运行时、SSG/SPA 预渲染时都会带上。
> - 静态资源写入 `nitro.options.output.publicDir`，Nitro 在三模式下都从该目录对外提供，轮询路径与 head 注入路径一致。

- [ ] **Step 2: 改用顶部 import 的 fs/path，去掉内联 require**

将文件顶部的 fs/path import 改为：

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
```

并把 `writeFileSafe` 简化为：

```ts
function writeFileSafe(filePath: string, content: string) {
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
}
```

> 这样避免 ESM 包内用 `require`（与仓库 `type: module` 一致），lint 更干净。

- [ ] **Step 3: 构建 core（确保 nuxt 能读到最新 core dist 与注入文件）**

Run: `pnpm --filter @plugin-web-update-notification/core build`
Expected: core `dist/` 含 `index.mjs`、`webUpdateNoticeInjectScript.iife.js`、`webUpdateNoticeInjectStyle.css`，无报错。

- [ ] **Step 4: 构建 nuxt 包**

Run: `pnpm --filter @plugin-web-update-notification/nuxt build`
Expected: 生成 `dist/index.mjs` 与 `dist/index.d.mts`，无类型/构建错误。

- [ ] **Step 5: 根 typecheck**

Run: `pnpm typecheck`
Expected: 通过（`@nuxt/schema` 增强与 module 泛型类型正确）。

> 若 `@nuxt/schema` 类型未解析，确认 `nuxt` 已作为 nuxt 包的 devDependency 安装（Task 1 已声明）。

- [ ] **Step 6: Commit**

```bash
git add packages/nuxt/src/index.ts
git commit -m "feat(nuxt): implement nuxt module for web update notification"
```

---

## Task 3: 文档（包 README + 根 README）

**Files:**
- Create: `packages/nuxt/README.md`
- Modify: `README.md`（根）
- Modify: `README.zh-CN.md`（根）

**Interfaces:**
- Consumes: Task 2 完成的 module（包名、configKey、配置项）。
- Produces: 安装与接入文档。

- [ ] **Step 1: 创建 `packages/nuxt/README.md`**

```markdown
# @plugin-web-update-notification/nuxt

Nuxt module for detecting web page updates and notifying users to reload. Supports Nuxt 3+ in SSG, SPA, and SSR modes.

## Install

```bash
pnpm add @plugin-web-update-notification/nuxt -D
```

## Usage

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@plugin-web-update-notification/nuxt'],
  webUpdateNotification: {
    logVersion: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: '系统升级通知',
      description: '系统更新啦！请刷新后使用。',
      buttonText: '刷新',
      dismissButtonText: '忽略',
    },
  },
})
```

The module only runs in production builds. It reuses the shared options from
`@plugin-web-update-notification/core`; see the root README for the full option list.

> Types: add `/// <reference types="@plugin-web-update-notification/nuxt" />` to get
> `window.pluginWebUpdateNotice_` typings.
```

- [ ] **Step 2: 根 `README.md` — 支持列表与安装段加入 Nuxt**

将第 27 行的描述（`... support Vite, UmiJS, Webpack ...`）补上 Nuxt，并在 Install 段 `# rspack plugin` 块后追加：

```bash
# nuxt module
pnpm add @plugin-web-update-notification/nuxt -D
```

在 Usage 导航行（`[Vite](#vite) | [UmiJS](#umijs) | ...`）追加 `| [Nuxt](#nuxt)`，并在 Rspack 用法小节后新增：

```markdown
### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@plugin-web-update-notification/nuxt'],
  webUpdateNotification: {
    logVersion: true,
  },
})
```

Supports SSG (`nuxt generate`), SPA (`ssr: false`) and SSR (`nuxt build`). The module
only takes effect in production builds.
```

- [ ] **Step 3: `README.zh-CN.md` — 同步中文版**

在中文版对应位置做与 Step 2 等价的修改：描述行加入 Nuxt、安装段加入 `pnpm add @plugin-web-update-notification/nuxt -D`、Usage 导航加入 Nuxt、新增 Nuxt 用法小节（说明仅生产构建生效，支持 SSG/SPA/SSR 三模式）。

- [ ] **Step 4: 校验文档链接锚点**

Run: `grep -n "nuxt\|Nuxt" README.md README.zh-CN.md packages/nuxt/README.md`
Expected: 三处文件均出现 Nuxt 安装、Usage 小节与导航锚点 `#nuxt`，无遗漏。

- [ ] **Step 5: Commit**

```bash
git add packages/nuxt/README.md README.md README.zh-CN.md
git commit -m "docs(nuxt): add nuxt module usage docs"
```

---

## Self-Review

**Spec coverage：**

- 独立子包 `@plugin-web-update-notification/nuxt` → Task 1。
- Nuxt Module（defineNuxtModule）实现、复用 core → Task 2。
- 仅生产生效（`nuxt.options.dev` 判断）→ Task 2 Step 1。
- 版本获取复用 core `getVersion` → Task 2。
- `injectFileBase` 默认 `app.baseURL` → Task 2。
- head 注入（script + 条件 link，unhead）→ Task 2。
- body 锚点（Nitro `render:html`）→ Task 2。
- 静态资源写入 Nitro publicDir（version.json / inject.js / inject.css）→ Task 2。
- configKey `webUpdateNotification` + `Options` 复用 + `NuxtConfig`/`NuxtOptions` 类型增强 → Task 1（meta）+ Task 2（增强）。
- 包 README + 根 README/zh-CN → Task 3。
- Out of scope（example/测试/Nuxt 2）→ 计划未涉及，符合 spec。

**Placeholder scan：** Task 1 Step 3 的占位实现会在 Task 2 Step 1 被完整替换，非交付残留；其余步骤均含完整代码/命令，无 TODO/TBD。

**Type consistency：** 常量名与 core `constant.ts` 完全一致；`getVersion`/`generateJsFileContent`/`generateJSONFileContent`/`getFileHash`/`get__Dirname` 签名与 core 导出一致；`INJECT_SCRIPT_FILE_NAME` 含 `.iife`，读取源码用 `.js` 后缀、输出用 `.${hash}.js`，与 vite/umi 行为一致。
