# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个用于检测网页更新并通知用户刷新的插件系统，支持 Vite、UmiJS、Webpack 和 Rspack。核心原理是：通过 git commit hash（也支持 svn revision、package.json version、build timestamp、custom）作为版本号，打包时将版本号写入 JSON 文件，客户端轮询服务器上的版本号并与本地比较，如果不同则通知用户刷新。

## Monorepo 架构

项目使用 pnpm workspace + turbo 管理 monorepo：

- **packages/core**: 核心逻辑库，包含版本获取、文件生成等通用功能
- **packages/vite-plugin**: Vite 插件实现
- **packages/umi-plugin**: UmiJS 插件实现
- **packages/webpack-plugin**: Webpack 插件实现
- **packages/rspack-plugin**: Rspack 插件实现（同时支持 Rsbuild）
- **example/**: 各种框架的示例项目（vue-vite、react-vite、svelte-vite、react-umi、vue-webpack、vue-rspack）

各插件包依赖 core 包（通过 `workspace:*`），共享核心功能。

## 常用命令

### 构建

```bash
# 构建所有包
pnpm build

# 开发特定包
pnpm dev:vite      # 开发 vite 插件
pnpm dev:umi       # 开发 umi 插件
pnpm dev:webpack   # 开发 webpack 插件
pnpm dev:rspack    # 开发 rspack 插件
```

### 示例运行

```bash
pnpm example:vue-vite      # 运行 Vue + Vite 示例
pnpm example:react-vite    # 运行 React + Vite 示例
pnpm example:svelte-vite   # 运行 Svelte + Vite 示例
pnpm example:react-umi     # 运行 React + Umi 示例
pnpm example:vue-webpack   # 运行 Vue + Webpack 示例
pnpm example:vue-rspack    # 运行 Vue + Rspack 示例
```

### 测试和检查

```bash
pnpm test:unit    # 运行单元测试（vitest）
pnpm test:e2e     # 运行 E2E 测试
pnpm lint         # 代码检查
pnpm typecheck    # 类型检查
```

### 发布

```bash
pnpm release      # 使用 bumpp 更新版本号
pnpm publish      # 发布所有包到 npm
```

## 核心架构设计

### 版本获取策略（packages/core/src/index.ts）

通过策略模式实现多种版本类型：

- `git_commit_hash`: 执行 `git rev-parse --short HEAD`
- `svn_revision_number`: 执行 `svnversion`
- `pkg_version`: 读取 `process.env.npm_package_version`
- `build_timestamp`: 使用 `Date.now()`
- `custom`: 自定义版本号

如果获取失败会自动降级到 `build_timestamp`。仓库类型自动检测（通过查找 .git 或 .svn 目录）。

### 插件工作流程

1. **构建时**：
   - 获取版本号
   - 生成 `version.json` 文件（包含版本号和 silence 标志）
   - 生成并注入检测脚本（`webUpdateNoticeInjectScript.js`）
   - 生成并注入样式文件（`webUpdateNoticeInjectStyle.css`）
   - 在 HTML 中注入 script 标签、link 标签和通知锚点元素

2. **运行时**（客户端）：
   - 注入的脚本会在以下时机检查更新：
     - 首次加载页面
     - 轮询（默认 10 分钟）
     - script 资源加载失败（404）
     - 标签页重新获得焦点或可见
   - 对比本地版本和服务器版本
   - 如不同则显示通知或触发自定义事件

### Vite 插件实现要点（packages/vite-plugin/src/index.ts）

- 使用 `apply: 'build'` 仅在构建时生效
- 使用 `enforce: 'post'` 确保在其他插件之后执行
- 在 `configResolved` 钩子中：自动获取 `viteConfig.base` 作为 `injectFileBase`
- 在 `generateBundle` 钩子中：使用 `emitFile` API 生成 JSON、CSS、JS 文件
- 在 `transformIndexHtml` 钩子中：注入 script/link 标签和通知锚点

### 文件哈希机制

所有注入的文件都带有内容哈希（MD5 前 8 位），确保缓存更新：

- `webUpdateNoticeInjectScript.[hash].js`
- `webUpdateNoticeInjectStyle.[hash].css`

注意：IIFE 输出后缀为 `.iife`（由 tsdown 生成）。

## 开发注意事项

### 修改核心逻辑

如果修改 `packages/core` 的代码，需要重新构建才能被其他包使用：

```bash
pnpm --filter=@plugin-web-update-notification/core build
```

### 修改注入脚本

注入脚本源码在 `packages/core/src/injectScript.ts`，通过 tsdown 构建为独立的 bundle。修改后需要重新构建 core 包。

### 添加新的版本类型

在 `packages/core/src/index.ts` 的 `getVersionStrategies` 对象中添加新策略，并更新 `VersionType` 类型定义。

### 国际化

默认语言配置在 `packages/core/src/locale.ts`，支持 `zh_CN`、`zh_TW`、`en_US`。

### TypeScript 类型

如果用户需要 `window.pluginWebUpdateNotice_` 的类型提示，需要在项目中添加：

```ts
/// <reference types="@plugin-web-update-notification/vite" />
```

## 技术栈

- **构建工具**: tsdown（基于 Rolldown）
- **包管理器**: pnpm (v10.8.0)
- **Node.js**: 使用 package.json 中的 packageManager 字段指定版本
- **Monorepo**: Turborepo
- **测试**: Vitest + Playwright (E2E)
- **代码规范**: @antfu/eslint-config
