import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { addServerPlugin, addTemplate, defineNuxtModule } from '@nuxt/kit'
import type { Nitro as NitroInstance } from 'nitropack/types'
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
      nuxt: '^3.0.0 || ^4.0.0',
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
      src: `${injectFileBase}${jsFileName}`,
      'data-id': INJECT_SCRIPT_TAG_ID,
      'data-v': version,
      tagPriority: 'high',
    })

    if (showDefaultNotification) {
      nuxt.options.app.head.link.push({
        rel: 'stylesheet',
        href: `${injectFileBase}${cssFileName}`,
      })
    }

    // 2) 注入 body 通知锚点
    //
    // 不能用构建期的 `nitro.hooks.hook('render:html', ...)`：通过 `nitro:init` 拿到的
    // `nitro` 是构建期对象，构建过程中根本不会有 HTML 渲染请求经过它，挂在它上面的
    // `render:html` 监听器永远不会被调用。真正在每次渲染时触发 `render:html` 的是部署后
    // 的运行时 `nitroApp`（@nuxt/nitro-server 的 renderer 在每次请求时
    // `nitroApp.hooks.callHook('render:html', ...)`），SSR 运行时渲染、SSG prerender（内部
    // 仍是对编译产物发起请求）、SPA shell 渲染三种模式走的都是这同一条运行时渲染链路。
    // 所以要用 Nitro server plugin（`addServerPlugin`）把回调注册到运行时 nitroApp 上。
    if (!hiddenDefaultNotification) {
      const renderHtmlPlugin = addTemplate({
        filename: 'plugin-web-update-notification-render-html.mjs',
        write: true,
        getContents: () =>
          [
            'export default (nitroApp) => {',
            '  nitroApp.hooks.hook(\'render:html\', (html) => {',
            `    html.bodyAppend.push('<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>')`,
            '  })',
            '}',
            '',
          ].join('\n'),
      })
      addServerPlugin(renderHtmlPlugin.dst)
    }

    // 3) 产出静态资源到 Nitro publicDir
    //
    // `nitro:build:public-assets` 是 Nitro 在构建期触发的 hook，未出现在公开的
    // `@nuxt/schema`/`nitropack` 类型里，这里本地 cast `nuxt.hook` 而不是改写那些外部模块
    // 的类型，避免把 Nitro 内部类型图灌进本包发布的 `.d.ts`。
    type NitroHook = (name: string, fn: (nitro: NitroInstance) => void | Promise<void>) => void
    const nuxtHook = nuxt.hook as unknown as NitroHook
    nuxtHook('nitro:build:public-assets', (nitro) => {
      const publicDir = nitro.options.output.publicDir

      writeFileSafe(resolve(publicDir, jsonFileName), generateJSONFileContent(version, silence))
      writeFileSafe(resolve(publicDir, jsFileName), jsFileSource)
      if (showDefaultNotification) writeFileSafe(resolve(publicDir, cssFileName), cssFileSource)
    })
  },
})

function writeFileSafe(filePath: string, content: string) {
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
