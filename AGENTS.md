# AGENTS.md

检测网页更新并通知用户刷新的插件 monorepo（pnpm workspace + turbo）。构建时把版本号（默认 git commit hash）写入 JSON 文件，注入页面的客户端脚本轮询这个文件，与页面内的版本号比较。

## 目录

- `packages/core`：版本获取、注入文件生成，以及客户端注入脚本 `src/injectScript.ts`（单独打包为 IIFE，产物后缀是 `.iife`）
- `packages/{vite,umi,webpack,rspack}-plugin`、`packages/nuxt`：各框架适配，通过 `workspace:*` 依赖 core。rspack 插件同时支持 Rsbuild
- `example/*`：示例项目。目录名和包名不同，`--filter` 要用包名：`vue-vite3` → `vue-vite-example`、`react-vite` → `react-vite-example`、`svelte-vite` → `svelte-vite-example`、`react-umi` → `react-umi-example`、`vue-cli` → `vue-cli`（Webpack）、`vue-rspack` → `vue-rspack`、`nuxt` → `nuxt-example`。`vue-vite5`、`vue-vite7` 没有对应的根脚本
- `e2e/`：所有 example 的 Playwright 测试，example 内不放测试，说明见 `e2e/README.md`。单个目标加 `--project=<name>`，取值见 `e2e/targets.ts`

## 构建依赖

core 的 `main`、`types` 都指向 `dist`。插件包的单测、`pnpm typecheck`、`pnpm test:e2e` 都要先 `pnpm build`；只改了 core 时，可以只跑 `pnpm --filter=@plugin-web-update-notification/core build`。

CI 从干净的 clone 开始，没有 `dist`。本地留着旧产物时，安装钩子、包入口、构建脚本出的问题在本地不会暴露。

## 修改文档

只编辑根目录的 `README.md` 和 `README.zh-CN.md`，不要直接改 `packages/*/README*.md`。子包文档是根目录文档的副本，改完后运行以下命令同步（`LICENSE` 也会一并复制）：

```bash
pnpm synchronous-doc
```

## 排查 CI 与查询 registry

- CI 或发布失败时，先用 `gh run list` 和 `gh run view <id> --log-failed` 读完整日志，截图通常只有部分内容。日志过期后会返回 HTTP 410。
- 在仓库内查询包版本用 `pnpm view`。`npm view` 会因 `devEngines` 锁定的 Node 版本与本机不符而报 `EBADDEVENGINES`。

## 工具链

- **Node.js**：23.11.0，由根 `package.json` 的 `devEngines.runtime` 锁定（`onFail: download`）。pnpm 会下载该版本并用它运行所有脚本，包括 workspace 包的 lifecycle 脚本；本机 Node 只需满足 pnpm 11 自身的要求（>= 22.13）
- **pnpm 配置**：pnpm 11 只从 `.npmrc` 读取 registry 与认证设置，其余设置（如 `ignoreWorkspaceRootCheck`、依赖构建脚本白名单 `allowBuilds`）都写在 `pnpm-workspace.yaml`。新增带构建脚本的依赖时，需要在 `allowBuilds` 中显式声明 `true` 或 `false`，否则安装会报 `ERR_PNPM_IGNORED_BUILDS`
