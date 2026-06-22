import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineNuxtModule } from '@nuxt/kit'
import type { NuxtRenderHTMLContext } from 'nuxt/app'
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

    // 2) 注入 body 通知锚点（Nitro render:html，覆盖三模式渲染产物）
    //
    // `nitro:init`/`nitro:build:public-assets`/`render:html` are added by Nitro's
    // runtime (@nuxt/nitro-server) at app build time, so they aren't present on the
    // public `@nuxt/schema`/`nitropack` types this package is built against. Casting
    // `nuxt.hook` locally (instead of augmenting those external modules) keeps this
    // package's published `.d.ts` slim without bloating it with Nitro's internal type
    // graph. The `render:html` cast intentionally narrows the full signature to only
    // what this callback uses (the first parameter).
    type NitroHook = (name: string, fn: (nitro: NitroInstance) => void | Promise<void>) => void
    const nuxtHook = nuxt.hook as unknown as NitroHook

    if (!hiddenDefaultNotification) {
      nuxtHook('nitro:init', (nitro) => {
        const nitroHook = nitro.hooks.hook as unknown as (
          name: string,
          fn: (html: NuxtRenderHTMLContext, context?: { event: unknown }) => void | Promise<void>,
        ) => void
        nitroHook('render:html', (html) => {
          html.bodyAppend.push(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`)
        })
      })
    }

    // 3) 产出静态资源到 Nitro publicDir
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
