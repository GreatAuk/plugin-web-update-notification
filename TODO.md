# plugin-web-update-notification 项目 Review

- 审阅日期：2026-11-10
- 审阅版本：v2.1.3（commit `0a01eba`）
- 审阅范围：`packages/*` 全部源码、根配置、CI 工作流、示例项目与 README
- 本地验证结果：`pnpm lint` 通过（1 个警告）；`pnpm typecheck` 失败（41 个错误）；`pnpm test:unit` 失败（没有任何测试文件）；CI 的 `nr test` 步骤失败（根目录没有 `test` 脚本）

问题按「Bug → 可优化点 → 新功能建议」三部分列出，每部分内按影响程度排序。每条给出位置、现象、影响和建议。

---

## 一、Bug

### 1.1 高影响

#### [Done] B1. ESM 类型产物丢失了 `window.pluginWebUpdateNotice_` 全局类型增强

- 位置：`packages/core/src/index.ts:7`（`import './shim.d.ts'`）、`packages/core/dist/index.d.mts`
- 现象：构建后 `dist/index.d.cts` 包含 `declare global { interface Window { pluginWebUpdateNotice_ ... } }`，但 `dist/index.d.mts` 完全没有这段声明（`grep pluginWebUpdateNotice_ dist/index.d.mts` 结果为 0）。
- 影响：`exports.types.import` 指向 `index.d.mts`，所以 Vite、Nuxt 用户以及所有以 ESM 方式解析类型的 webpack / rspack 用户，按 README「Q&A 1」加上 `/// <reference types="@plugin-web-update-notification/vite" />` 后仍然拿不到 `window.pluginWebUpdateNotice_`、`plugin_web_update_notice` 事件的类型。这是 tsup 迁移到 tsdown 时引入的回归（commit `d2cd214`）。
- 建议：不要用副作用 `import './shim.d.ts'`（oxlint 也对此告警），改为把全局声明放进 `src/type.ts` 或单独的 `client.d.ts`，并在 `package.json` 的 `exports` 中显式暴露（如 `"./client"`），或在 `tsdown.config.ts` 里确认 dts 插件会内联 `declare global`。修复后在 CI 增加一个 `tsc` 消费测试，断言 `window.pluginWebUpdateNotice_` 可用。

#### B2. [Done] `versionType: 'pkg_version'` 在不通过 npm scripts 运行时静默产出字符串 `"undefined"`

- 位置：`packages/core/src/index.ts:58`
- 现象：`getHostProjectPkgVersion` 直接返回 `process.env.npm_package_version`，这个环境变量只在 `pnpm run xxx` / `npm run xxx` 下存在。直接执行 `npx vite build`、在 Docker / CI 用 `node` 调用构建脚本、或通过 Turborepo 等工具调度时，它是 `undefined`。读取环境变量永远不会抛错，所以外层 `try/catch` 和「降级到时间戳」逻辑都不会触发。
- 影响：`version.json` 里写入 `"version": "undefined"`，所有后续构建都相等，用户永远收不到更新通知，且没有任何告警。
- 建议：用 `find-up` 找到宿主项目 `package.json` 并读取 `version` 字段；找不到或为空时抛错以触发降级，同时输出告警。

#### B3. `.git` 为文件（git worktree / submodule）时仓库类型检测失败，静默降级到时间戳

- 位置：`packages/core/src/index.ts:44`（`findUpSync('.git', { type: 'directory' })`）
- 现象：git worktree 和 submodule 中的 `.git` 是一个文件而不是目录，`checkRepoType` 返回 `'unknown'`，默认策略变成空字符串。
- 影响：用户没有设置 `versionType` 时，实际使用了 `build_timestamp`，与文档描述的「Git 仓库默认 `git_commit_hash`」不符；并且会打印一条令人困惑的告警（见 B4）。
- 建议：`findUpSync('.git')` 不限定类型，或直接尝试 `git rev-parse --is-inside-work-tree`。

#### [Done] B4. 仓库类型为 `unknown` 时告警文案错误且多余

- 位置：`packages/core/src/index.ts:140`、`:150`
- 现象：`defaultStrategyMap.unknown = ''`，导致 `versionType_` 为空字符串，进入「version type 不支持」分支，打印的是 `The version type 'undefined' is not supported!`（模板里用的是原始参数 `versionType`，不是 `versionType_`）。
- 影响：没有 `.git` / `.svn` 的项目（例如 CI 里只拷贝源码、或者下载 zip 的项目）每次构建都看到一条错误的告警，容易误以为配置写错。
- 建议：`unknown` 直接映射到 `'build_timestamp'`，并把告警文案里的变量改为 `versionType_`。

#### [Done] B5. 后台标签页加载后会创建重复的轮询定时器

- 位置：`packages/core/src/injectScript.ts:144`、`:153`
- 现象：`__checkUpdateSetup__` 启动时无条件调用一次 `pollingCheck()` 创建 `setInterval`；`visibilitychange` 变为 `visible` 时再次调用 `pollingCheck()`，但只有 `hidden` 事件才会 `clearInterval`。页面在后台标签页中打开（初始状态就是 `hidden`，不会触发 `hidden` 事件），用户切回来时会出现第二个定时器，旧的永远不会被清理。
- 影响：轮询频率翻倍，多次切换后持续累积，造成服务器无意义请求与内存泄漏。
- 建议：`pollingCheck` 内先 `clearInterval(intervalTimer)` 再创建；或在启动时根据 `document.visibilityState` 决定是否立即开启轮询。

#### [Done] B6. Vite `base: './'`（相对路径）时，嵌套路由下 `version.json` 请求 404

- 位置：`packages/vite-plugin/src/index.ts:93`、`packages/core/src/injectScript.ts:101`
- 现象：插件自动把 `viteConfig.base` 作为 `injectFileBase`。当用户配置 `base: './'` 时，运行时 `fetch('./pluginWebUpdateNotice/web_version_by_plugin.json')` 相对于当前页面 URL 解析。在 history 模式的 SPA 中访问 `/user/profile`，请求会落到 `/user/pluginWebUpdateNotice/...`。
- 影响：非首页路径上更新检测全部失败，控制台持续报错。README「Options」把 `./` 列为合法值，但没有说明这个限制。
- 建议：检测到相对 base 时，在注入脚本里用 `document.currentScript.src` 或 `script[data-id]` 的 `src` 推导绝对目录；至少在文档中明确说明 `./` 仅适用于 hash 路由。

#### [Done] B7. CI 工作流 `test` 任务必然失败

- 位置：`.github/workflows/ci.yml:75`（`run: nr test`）、根 `package.json`
- 现象：根目录只有 `test:unit` 和 `test:e2e`，没有 `test` 脚本。本地执行 `nr test` 输出 `ERR_PNPM_NO_SCRIPT Missing script: test`。
- 影响：三个操作系统矩阵的测试任务全部红。
- 建议：添加 `"test": "pnpm test:unit"`，或把 CI 改为分别运行 `test:unit` 和 `test:e2e`。

#### B8. `pnpm typecheck` 失败（41 个错误），CI 的 `typecheck` 任务同样红

- 位置：根 `tsconfig.json`（没有 `include` / `exclude`，也没有 `jsx`）、`example/nuxt/nuxt.config.ts:9`、`example/react-umi/tests/e2e/plugin.spec.ts:7`
- 现象：根 `tsc --noEmit` 把所有 `example/**` 一并检查，遇到：示例里的 JSX 没有 `--jsx` 配置；`example/vue-vite3` 使用 vite 3 的 `Plugin` 类型与插件包依赖的 vite 5 类型冲突；`nuxt.config.ts` 里 `webUpdateNotification` 键不被识别（示例没有拿到包内 `declare module '@nuxt/schema'` 增强，与 B1 同源）；umi 示例的 e2e 引用了早已改名的 `web-update-notification-core`。
- 建议：根 `tsconfig.json` 加 `"include": ["packages/*/src"]`，示例各自独立类型检查；或者用 `tsc -b` 分别引用各包。

#### [Done] B9. 单元测试完全缺失，`pnpm test:unit` 以退出码 1 结束

- 位置：`vitest.config.ts`、整个 `packages/` 目录
- 现象：`vitest --run` 输出 `No test files found, exiting with code 1`。AGENTS.md 和 README 都声称有单元测试。
- 影响：`getVersion` 的降级逻辑、`generateJsFileContent` 的序列化、注入脚本的节流与定时器逻辑都没有任何自动化保护，上面 B2 到 B5 都是本应被单测拦住的问题。
- 建议：至少为 `core` 添加 `getVersion`（mock `execSync` / 环境变量）、`generateJSONFileContent`、`generateJsFileContent`、`getFileHash` 的单测；用 `happy-dom` / `jsdom` 为 `injectScript.ts` 写定时器与 `fetch` 的单测。

### 1.2 中影响

#### B10. Vite / Umi 示例的 e2e 测试与当前产物不匹配，无法通过

- 位置：`example/vue-vite3/tests/e2e/plugin.spec.ts:18-27`、`example/react-umi/tests/e2e/plugin.spec.ts`
- 现象：vue-vite3 断言 `script[src="/pluginWebUpdateNotice/webUpdateNoticeInjectScript.iife.js"]`，但实际文件名含内容哈希（`...iife.f6970a8e.js`），选择器永远匹配不到（`example/nuxt/tests/e2e/shared.ts` 的注释已经指出了这一点）。umi 的 e2e 还在引用旧包名 `web-update-notification-core`，并断言 JSON 里有 `hash` 字段（现在是 `version`）。
- 另外 `.gitignore` 里有一行 `example/react-umi`，整个 umi 示例（含 e2e）没有进入版本库，`git ls-files example/react-umi` 为空。
- 建议：把 vue-vite3 的选择器改成与 nuxt 示例一致的正则匹配；重写 umi e2e；从 `.gitignore` 移除 `example/react-umi`；根 `test:e2e` 覆盖 webpack / rspack / umi 示例。

#### [Done] B11. Umi 插件 `mkdirSync` 没有 `recursive`，输出目录已存在时直接抛错

- 位置：`packages/umi-plugin/src/index.ts:108`
- 现象：`mkdirSync(\`${outputPath}/${DIRECTORY_NAME}\`)`在目录已存在时抛`EEXIST`。用户关闭 Umi 的清理输出目录行为、或自定义 `outputPath` 指向已有目录时构建失败。
- 建议：`mkdirSync(dir, { recursive: true })`，与 Nuxt 包里的 `writeFileSafe` 保持一致；同时 `outputPath` 应使用 `api.paths.absOutputPath` 而不是 `api.userConfig.outputPath`。

#### [Done] B12. Umi 插件的 Joi 校验拒绝 `logVersion` 传函数

- 位置：`packages/umi-plugin/src/index.ts:32`（`logVersion: Joi.boolean()`）
- 现象：`Options.logVersion` 类型是 `boolean | ((version: string) => void)`，README 也示范了传函数，但 Umi 的 schema 只允许 boolean，传函数时配置校验报错。
- 建议：改为 `Joi.alternatives(Joi.boolean(), Joi.function())`，并补上 `versionType` 的枚举校验。

#### [Done] B13. webpack 插件在 dev / watch 模式也会执行，且每次都尝试改写磁盘上的 `index.html`

- 位置：`packages/webpack-plugin/src/index.ts:85`、`:122`
- 现象：插件没有任何 `mode === 'production'` 判断。配合 `webpack-dev-server` 时，产物在内存里，`afterEmit` 读取 `compiler.outputPath/index.html` 失败，每次增量编译都打印一段错误堆栈。
- 影响：开发体验差；README 也没有提示「只在生产环境注册」。Rspack 插件存在同样问题。
- 建议：`apply` 中判断 `compiler.options.mode !== 'production'` 或 `compiler.watchMode` 时直接返回，并在文档中说明。

#### [Done] B14. webpack 插件使用已废弃的 `emit` 钩子和裸对象资源

- 位置：`packages/webpack-plugin/src/index.ts:85-120`
- 现象：直接给 `compilation.assets[...]` 赋值 `{ source, size }`，需要三处 `@ts-expect-error` 绕过类型检查；`size()` 用的是 `string.length`，对包含中文（locale 文案）的 JS / CSS 内容返回的是字符数而不是字节数，webpack stats 中的资源大小不准。webpack 5 推荐 `compilation.hooks.processAssets` + `webpack.sources.RawSource`。
- 建议：对齐 Rspack 包的实现方式（`thisCompilation` → `processAssets` + `RawSource`）。

#### B15. HTML 注入依赖字面量 `'<head>'` / `'</body>'` 替换

- 位置：`packages/vite-plugin/src/index.ts:47`、`packages/webpack-plugin/src/index.ts:48`、`packages/rspack-plugin/src/index.ts:128`
- 现象：`html.replace('<head>', ...)` 对 `<head lang="zh">`、`<HEAD>`、`<head\n>` 都不生效，脚本会静默不注入，运行时 `getLocaleVersion` 找不到 script 标签。
- 建议：Vite 插件应使用 `transformIndexHtml` 返回 `{ html, tags: [{ tag: 'script', attrs, injectTo: 'head-prepend' }] }`，由 Vite 负责插入；webpack / rspack 优先接入 `html-webpack-plugin` / `HtmlRspackPlugin` 的 `alterAssetTags` 钩子，字符串替换只作为兜底并改用不区分大小写的正则。

#### B16. 注入脚本在全局词法作用域声明 `const logFn`

- 位置：`packages/core/src/index.ts:187`
- 现象：注入的是经典 `<script>`（非 module），`;const logFn = ...` 直接写在顶层，会在页面全局词法环境创建 `logFn` 绑定。宿主页面任何其他脚本若也在顶层声明 `const logFn` / `let logFn`，浏览器抛 `SyntaxError: Identifier 'logFn' has already been declared`，整段脚本不执行。
- 建议：把 setup 调用和 log 逻辑包进 IIFE。顺带说明：`logVersion` 传函数时是 `fn.toString()` 后原样写入，函数体里引用的闭包变量 / import 在浏览器里不存在，文档应提示这个限制。

#### [Done] B17. `checkOnLoadFileError` 触发的检查没有节流

- 位置：`packages/core/src/injectScript.ts:170`
- 现象：捕获阶段的 `error` 监听里直接调用 `checkSystemUpdate()`，而不是 `limitCheckSystemUpdate`。一次部署切换时若多个 chunk 同时 404，会瞬间并发多次 `version.json` 请求。
- 建议：改用节流版本。

#### B18. Nuxt 包依赖 `@nuxt/kit@^3`，但 peer 声明支持 Nuxt 4

- 位置：`packages/nuxt/package.json:43`
- 现象：Nuxt 4 项目会同时安装 `@nuxt/kit@3` 和 `@nuxt/kit@4`，两份 kit 的内部状态（`useNuxt()` 等）可能不一致。
- 建议：`"@nuxt/kit": "^3.0.0 || ^4.0.0"`，或改为 peerDependency。

### 1.3 低影响

#### B19. 根 `package.json` 缺少 `"private": true`，且 `main` / `exports` 指向不存在的 `./dist/index.js`

- 位置：根 `package.json:21-39`
- 影响：误执行 `npm publish` 会发布一个空壳包；`files: ["dist"]` 在根目录没有意义。

#### B20. 根脚本与 AGENTS.md 描述不一致

- `dev:umi` 实际过滤的是 `core` 包（`package.json:42`），不是 umijs。
- AGENTS.md 列出的 `pnpm dev:rspack`、`pnpm example:vue-rspack` 在 `package.json` 中不存在。
- AGENTS.md 说代码规范是 `@antfu/eslint-config`，实际是 oxlint + oxfmt；说 monorepo 有四个插件包，实际还有 `packages/nuxt`。
- `pnpm-workspace.yaml` 里的 `useNodeVersion` 字段当前 pnpm 不识别（每条命令都打印告警），应为 `nodeVersion` 或改用 `engines` / `.nvmrc`。

#### B21. 包元数据复制粘贴错误

- `packages/webpack-plugin/package.json:20`：`repository.directory` 写的是 `packages/vite-plugin`。
- `packages/umi-plugin/package.json`：`keywords` 第一项是 `@plugin-web-update-notification/core`。
- `scripts/copyFile.ts` 只同步 README / LICENSE 到 core、vite、umi、webpack 四个包，rspack 与 nuxt 没有纳入（`diff README.md packages/rspack-plugin/README.md` 有差异）。

#### B22. 文档与实现不一致

- README `:477` 的 `VersionType` 漏掉了 `svn_revision_number`（`README.zh-CN.md:466` 同样）。
- README `:513`、`:524` 说 `checkUpdate` 是 `debounce(5000ms)`，实现 `limit()` 是「5 秒内只执行第一次」的节流。
- `Options.logVersion` 类型声明为 `(version: string) => void`，实际调用是 `(version, releaseTime)`，第二个参数没有暴露给类型与文档。
- README 的 Umi 示例用 `as WebUpdateNotificationOptions` 断言，而不是用 `defineConfig`，无法获得字段补全。

#### B23. 其他小问题

- `packages/core/src/buildScript.ts` 是死代码（commit `cedcb49` 已不再调用，`sourcemap: false` 也已使最终目的落空）。
- `packages/core/src/injectScript.ts:19` 在浏览器脚本里使用 `NodeJS.Timeout` 类型，应为 `ReturnType<typeof setInterval>`。
- `injectScript.ts:27` `limit(fn: Function, ...)` 使用宽泛的 `Function` 类型。
- `injectScript.ts:96` 等处把「本地版本」命名为 `getLocaleVersion` / `localeVersion`，与 i18n 的 `locale` 混淆。
- Vite 插件 `name: 'vue-vite-web-update-notice'`（`vite-plugin/src/index.ts:87`）是历史遗留名字，与包名不符，影响 `vite --debug` 和错误堆栈中的辨识。
- Vite 插件仍同时保留 `enforce` / `transform` 与 `order` / `handler` 两套字段（`:145`），peer 已是 vite ≥ 3，可以删掉旧字段。
- Rspack 包 `injectPluginHtml` 的注释写着「Fallback: ... when HtmlRspackPlugin is not available」，但代码里并没有主路径，只有这一条路径。
- 各插件都直接修改用户传入的 `options` 对象（写 `injectFileBase`），同一个 options 对象复用在多个构建配置时会被第一次构建污染。
- `.github/workflows/*.yml` 使用 `actions/checkout@v3`、`setup-node@v3`、`pnpm/action-setup@v2.0.1` 和已废弃的 `::set-output`，release 工作流的 `publish-npm` 没有 `needs: release`。

---

## 二、可优化点

### 2.1 架构与代码复用

1. **合并四份几乎相同的 `injectPluginHtml`**：vite / webpack / rspack 各自维护一份 HTML 注入函数，umi 与 nuxt 又各写一套。应下沉到 `core`，输出「要注入的标签描述」而不是直接操作字符串，由各适配层决定插入方式。
2. **`generateJsFileContent` / 读取 css / 计算 hash 的流程重复 5 次**：可在 `core` 提供 `prepareInjectAssets(options, version)` 返回 `{ js, css, json, jsFileName, cssFileName, jsonFileName }`，各插件只负责「写到哪」。
3. **考虑用 unplugin 统一 vite / webpack / rspack / rollup / esbuild / farm**：三个包的差异只在「资源怎么 emit、HTML 怎么改」，unplugin 已经抽象了这两件事，可以把三个包收敛为一个，同时免费获得 rollup / esbuild / farm 支持。Umi 和 Nuxt 可继续独立。
4. **版本号计算放到插件工厂函数的调用期**：目前 `getVersion()` 在 `webUpdateNotice()` 被调用时立即执行 `git rev-parse`，即使 `apply: 'build'` 让插件在 dev 下不生效，`vite dev` 仍会执行一次 git 命令。把计算延迟到 `configResolved` / `apply` 阶段更合理。
5. **`checkRepoType` 使用 `findUpSync` 从 `process.cwd()` 向上找**：monorepo 子包构建时 cwd 可能不是仓库根，当前实现可以工作，但建议改用 `git rev-parse --show-toplevel` 一次性判断，减少对文件系统布局的假设。
6. **`hiddenDefaultNotification: true` 时仍打包整套通知 UI 代码**（TODO.md 第 3 项仍未完成）：可以把 `injectScript.ts` 拆成 `checker`（检测 + 事件派发）和 `notification`（UI）两个 entry，按选项拼接。
7. **CJS 产物里对 `import.meta.url` 的处理依赖 try/catch**（`get__Dirname`）：建议直接用 tsdown 的 `shims: true` 处理 `__dirname` / `import.meta.url` 互转，删掉手写兜底。

### 2.2 运行时脚本

1. **把注入 `<script>` 改为 `defer`**：目前是放在 `<head>` 最前面的同步脚本，会阻塞首屏渲染。脚本本身只依赖 `document.body` 在回调里存在，加 `defer` 没有副作用。
2. **`fetch` 加 `cache: 'no-store'`**：现在只靠 `?t=` 查询参数破缓存，部分 CDN 会忽略查询串；两者叠加更稳。
3. **离线与失败退避**：`navigator.onLine === false` 时跳过检查；连续失败时指数退避并在恢复后重置，避免服务不可用期间每 5 秒一次控制台错误。
4. **页面 `hidden` 时中止进行中的请求**：用 `AbortController`，避免后台标签页堆积请求。
5. **`localStorage` 访问包在 try/catch 里**：Safari 隐私模式、被禁用 storage 的 WebView 会抛异常；`dismissUpdate` 已经处理了，`getItem` 分支没有。
6. **清理历史 dismiss 记录**：每个被忽略的版本都在 `localStorage` 留下一个 key，永不删除；可在写入新 key 时删除同前缀的旧 key。
7. **`setLocale` 后重新渲染已显示的通知**：目前切换语言只影响下一次显示。
8. **可访问性**：通知容器加 `role="alert"` / `aria-live="polite"`；两个按钮是没有 `href` 的 `<a>`，键盘不可聚焦，应改成 `<button type="button">`。
9. **CSP 兼容**：按钮颜色通过内联 `style="color:..."` 写入，严格 `style-src` 策略下会被拦截；改为 CSS 变量（`--pwun-primary-color`）写在容器 class 上由样式表消费，或支持传入 `nonce`。
10. **深色模式**：样式表只有浅色配色，可通过 CSS 变量 + `prefers-color-scheme` 提供默认深色主题，并允许用户覆盖变量。
11. **`z-index: 99999` 和 24px 边距硬编码**：改为 CSS 变量或 `notificationConfig` 可配。
12. **`notificationProps` / `localeData` 直接拼进 `innerHTML`**：虽然来源是构建配置，但建议对文本做 HTML 转义，或者用 `textContent` 构建节点，避免配置来自环境变量 / CMS 时的 XSS。
13. **微前端 / 多实例冲突**（TODO.md 第 5 项）：`window.pluginWebUpdateNotice_`、`window.__checkUpdateSetup__`、`hasShowSystemUpdateNotice` 等都是单例全局；qiankun 子应用里 `document.querySelector('script[data-id="_pwun_"]')` 会匹配到主应用的标签。可以把 `data-id` 和全局变量名带上项目标识（如 hash 后缀），并在 `setup` 时支持多实例。

### 2.3 工程化

1. **补齐单元测试与 e2e 覆盖**（见 B9、B10），并让 `pnpm test` 成为 CI 的唯一入口。
2. **依赖升级**：`vitest@0.29`（当前 3.x）、`turbo@1`（2.x 配置字段从 `pipeline` 改为 `tasks`）、`@types/node@18`（运行 Node 23）、`tsx@3`、`rimraf@3`、`bumpp@9`。建议接入 Renovate 或 Dependabot。
3. **CI 增加 `pnpm build` 后的产物检查**：例如用 `publint` / `@arethetypeswrong/cli` 检查各包 `exports` 与类型产物，这能直接拦住 B1。
4. **CHANGELOG**：release 工作流用 `changelogithub` 生成 GitHub Release，但仓库没有 `CHANGELOG.md`，npm 页面上看不到变更记录。可以用 `changesets` 同时管理版本、变更日志和多包发布。
5. **`example/` 目录治理**：vue-vite3 / vue-vite5 / vue-vite7 三个示例配置几乎相同，可以合并为一个并用 pnpm `overrides` 切换 vite 版本做兼容矩阵；每个示例的 `dist/` 已提交到仓库（`example/vue-vite3/dist` 等），应加入 `.gitignore`。
6. **README 体量**：根 README 已经超过 660 行并被复制到每个包，建议拆成 docs 站点（VitePress）或至少各包 README 只保留自己框架的用法，根 README 保留原理与 Options。
7. **AGENTS.md 与实际状态同步**（见 B20），并补充「修改 core 后必须 `pnpm build` 才能让 example 拿到新产物」之外的注意事项，例如 `shim.d.ts` 的处理方式。

---

## 三、新功能建议

按价值与实现成本大致排序。

### 3.1 高价值

1. **`version.json` 携带元数据并支持「强制刷新」**
   `VersionJSON` 扩展为 `{ version, silence?, force?, releaseTime?, releaseNotes?, minSupportedVersion? }`。`force: true` 或本地版本低于 `minSupportedVersion` 时自动 `location.reload()`（可配置倒计时）；`releaseNotes` 可渲染到通知里。这是用户最常手动实现的功能。
2. **自动刷新策略**：`autoReload: 'none' | 'onIdle' | 'onRouteChange' | 'countdown'`。`onRouteChange` 配合 `checkUpdate()` 在路由切换时刷新，用户无感；`onIdle` 在页面无操作一段时间后刷新。
3. **把 `hiddenDefaultNotification` 与回调整合成 `onUpdate` 选项**
   目前只能监听 `document.body` 上的自定义事件。提供 `onUpdate(ctx)`（`ctx` 含 `version`、`releaseTime`、`reload()`、`dismiss()`），和 `window.pluginWebUpdateNotice_.on('update', fn)` 这类显式 API，减少对 DOM 事件的依赖。
4. **`checkUpdate()` 返回 Promise**：`Promise<{ updated: boolean; version: string }>`，让路由守卫、业务代码能等待结果决定是否跳转。
5. **可配置的文件名与目录**：`DIRECTORY_NAME` / `JSON_FILE_NAME` 目前是常量；提供 `outputDir`、`versionFileName` 选项，便于多应用共用一个 CDN 目录或避免与已有路径冲突。
6. **unplugin 版本**（见 2.1 第 3 条）：一次性覆盖 rollup / esbuild / farm / rolldown。

### 3.2 中价值

7. **Next.js / Astro / SvelteKit / Angular 适配**：Nuxt 包已经验证了「SSR 框架需要独立模块」的路径，可按同样方式扩展；Astro 和 SvelteKit 走 Vite 插件 + 框架 hook，Next.js 需要 `next.config.js` 的 webpack 钩子 + `_document` 注入。
8. **无构建工具的独立模式**：发布一个 `@plugin-web-update-notification/client` ESM 包和一个 CLI（`pwun gen-version --out dist/`），让纯静态站点、非主流构建工具也能用。
9. **Service Worker / PWA 协同**：检测到更新时可选调用 `registration.update()`，并在 SW `waiting` 状态时提示「刷新后生效」，避免 PWA 场景下刷新仍然是旧版本。
10. **更多 i18n 预设**：目前只有 zh_CN / zh_TW / en_US，可以加 ja_JP、ko_KR、de_DE、fr_FR 等常见语言，并支持根据 `navigator.language` 自动选择。
11. **通知组件主题与位置扩展**：`placement` 增加 `top` / `bottom` 居中；提供 `theme: 'light' | 'dark' | 'auto'`；支持自动关闭时长 `duration`。
12. **版本比较策略**：`pkg_version` 下提供 `compare: 'notEqual' | 'semverGreater'`，回滚发布时不弹「发现新版本」。

### 3.3 低价值 / 长期

13. **多实例 / 微前端支持**（TODO.md 遗留项，见 2.2 第 13 条）。
14. **DevTools 面板或调试模式**：`debug: true` 时在控制台输出每次检测的请求 URL、本地 / 远端版本、下一次轮询时间，减少「为什么没弹」类 issue。
15. **ETag / Last-Modified 检测模式**：对无法写文件的部署环境，提供 `strategy: 'etag'`，用 `HEAD index.html` 的响应头做比较，不依赖 `version.json`。

---

## 四、建议的处理顺序

1. 先修 CI 可见的红灯：B7（`test` 脚本）、B8（根 tsconfig 范围）、B9（补最小单测）。
2. 修用户可感知的功能回归与静默失败：B1（ESM 类型）、B2（`pkg_version`）、B3 / B4（仓库检测）、B5（重复定时器）、B6（相对 base）。
3. 修各适配层的健壮性：B11 / B12（Umi）、B13 / B14（webpack 生产判断与资源 API）、B15（HTML 注入）、B18（Nuxt kit 版本）。
4. 清理文档与元数据：B19 到 B23。
5. 再按第二、三部分做重构与新功能，其中 `core` 下沉公共逻辑（2.1 第 1、2 条）应先于任何新适配器。
