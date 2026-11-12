# E2E 测试

所有 example 共用一套 Playwright 用例。每个 example（nuxt 按 ssr / spa / ssg 拆成三个）是一个「目标」，对应一个 Playwright project。

## 目录结构

| 文件                   | 作用                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `targets.ts`           | 目标描述表，新增或调整 example 只改这里                                     |
| `fixtures.ts`          | worker 级 fixture：清理产物、构建 example、启动服务，并把地址作为 `baseURL` |
| `plugin.spec.ts`       | 共享用例，所有目标都会跑一遍                                                |
| `playwright.config.ts` | 根据描述表为每个目标生成一个 project                                        |

## 运行

前置步骤（只需执行一次，插件源码改动后需重新构建）：

```bash
pnpm build
pnpm exec playwright install chromium
```

运行全部目标：

```bash
pnpm test:e2e
```

只运行一个目标（project 名就是描述表里的 `name`）：

```bash
pnpm test:e2e --project=nuxt-ssr
```

调试：

```bash
pnpm test:e2e --project=vue-vite7 --ui
pnpm test:e2e --project=vue-vite7 --debug
pnpm exec playwright show-report e2e/playwright-report
```

CI 中失败的用例会在重试时录制 trace，从 Actions 的 `playwright-report` artifact 下载报告后用 `show-report` 查看。

## 执行流程

1. 每个目标启动时删除 `outDir`，然后在 example 目录下执行 `pnpm run <build.script>`。
2. `serve.type` 为 `static` 时，用 `sirv` 在随机端口托管产物；为 `node` 时，以 `node <entry>` 启动服务，并通过 `PORT` 传入空闲端口。
3. 该目标的全部用例跑完后关闭服务。

所有目标串行执行（`workers: 1`），因为 nuxt 三种模式共用 `.output` 目录。

E2E 只构建 example，不构建 `packages/*`，所以插件改动后要先执行 `pnpm build`。

## 新增目标

在 `targets.ts` 的 `targets` 数组中追加一项：

```ts
{
  name: 'react-rspack',              // project 名，全局唯一
  dir: 'example/react-rspack',       // example 目录，相对仓库根目录
  build: { script: 'build' },        // 构建用的 package.json 脚本名，可选 env
  outDir: 'dist',                    // 构建产物目录，相对 dir，构建前会被删除
  serve: { type: 'static' },         // 或 { type: 'static', root: 'public' } / { type: 'node', entry: 'server/index.mjs' }
  texts: zhCN,                       // 通知中应出现的 title、buttonText、dismissButtonText
}
```

字段说明：

- `build.script`：如果 example 的 `build` 脚本包含类型检查等无关步骤，改用只执行构建的脚本，例如 vue-vite3 使用 `build-only`。
- `serve.root`：相对 `outDir`，表示静态托管的根目录，例如 nuxt generate 的产物在 `.output/public`。
- `serve.entry`：相对 `outDir`，表示 node 服务的入口文件。
- `texts`：与 example 中插件配置的 `locale` 或 `notificationProps` 保持一致。未配置时默认使用 `zh_CN`，文案见 `packages/core/src/locale.ts`。

example 本身不需要任何测试依赖或测试脚本。

## 新增用例

在 `plugin.spec.ts` 中添加 `test(...)`，所有目标都会自动执行。用例中可以通过 fixture 参数 `target` 读取当前目标的描述。如果某个目标因插件 bug 暂时无法通过，用 `test.fixme(target.name === 'xxx', '原因')` 标注，并记录到 `TODO.md`。
