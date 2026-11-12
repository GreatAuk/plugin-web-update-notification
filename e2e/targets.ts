export interface Target {
  /** Playwright project 名，用于 `--project=<name>` 过滤 */
  name: string
  /** example 目录，相对仓库根目录 */
  dir: string
  /** 构建方式：在 `dir` 下执行 `pnpm run <script>` */
  build: { script: string; env?: Record<string, string> }
  /** 构建产物目录，相对 `dir`，构建前会被删除 */
  outDir: string
  /**
   * 产物的托管方式：
   * - static：用静态服务器托管 `outDir/root`（root 默认为 `.`）
   * - node：执行 `node outDir/entry`，通过 `PORT` 环境变量传入端口
   */
  serve: { type: 'static'; root?: string } | { type: 'node'; entry: string }
  /** 通知中应出现的文案 */
  texts: { title: string; buttonText: string; dismissButtonText: string }
}

const zhCN = { title: '发现新版本', buttonText: '刷新', dismissButtonText: '忽略' }
const zhTW = { title: '發現新版本', buttonText: '刷新', dismissButtonText: '忽略' }
const enUS = { title: 'Discover new version', buttonText: 'Refresh', dismissButtonText: 'Dismiss' }
/** 示例里自定义的 notificationProps */
const custom = { title: 'system update', buttonText: 'refresh', dismissButtonText: 'dismiss' }

export const targets: Target[] = [
  {
    name: 'vue-vite3',
    dir: 'example/vue-vite3',
    build: { script: 'build-only' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: custom,
  },
  {
    name: 'vue-vite5',
    dir: 'example/vue-vite5',
    build: { script: 'build-only' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: custom,
  },
  {
    name: 'vue-vite7',
    dir: 'example/vue-vite7',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: zhCN,
  },
  {
    name: 'react-vite',
    dir: 'example/react-vite',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: zhCN,
  },
  {
    name: 'svelte-vite',
    dir: 'example/svelte-vite',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: zhTW,
  },
  {
    name: 'react-umi',
    dir: 'example/react-umi',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: zhCN,
  },
  {
    name: 'vue-webpack',
    dir: 'example/vue-cli',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: enUS,
  },
  {
    name: 'vue-rspack',
    dir: 'example/vue-rspack',
    build: { script: 'build' },
    outDir: 'dist',
    serve: { type: 'static' },
    texts: custom,
  },
  {
    name: 'nuxt-ssr',
    dir: 'example/nuxt',
    build: { script: 'build' },
    outDir: '.output',
    serve: { type: 'node', entry: 'server/index.mjs' },
    texts: custom,
  },
  {
    name: 'nuxt-spa',
    dir: 'example/nuxt',
    build: { script: 'build:spa' },
    outDir: '.output',
    serve: { type: 'node', entry: 'server/index.mjs' },
    texts: custom,
  },
  {
    name: 'nuxt-ssg',
    dir: 'example/nuxt',
    build: { script: 'generate' },
    outDir: '.output',
    serve: { type: 'static', root: 'public' },
    texts: custom,
  },
]
