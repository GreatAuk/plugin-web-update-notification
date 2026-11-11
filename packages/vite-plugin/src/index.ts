import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Options } from '@plugin-web-update-notification/core'

import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  generateJSONFileContent,
  generateJsFileContent,
  getFileHash,
  getVersion,
  get__Dirname,
  injectPluginHtml,
} from '@plugin-web-update-notification/core'

// /**
//  * Get the version of the current Vite
//  *
//  * if the viteVersion is undefined, we assume that vite is less than v3.0（after v3.0, vite export version）
//  */
// async function getViteVersion(): Promise<string | undefined> {
//   return await import('vite').then(({ version }) => version)
// }

export function webUpdateNotice(options: Options = {}): Plugin {
  let viteConfig: ResolvedConfig
  // let viteVersion: string | undefined

  const { versionType, customVersion, silence } = options
  let version = ''
  if (versionType === 'custom') version = getVersion(versionType, customVersion!)
  else version = getVersion(versionType!)

  /** inject script file hash */
  let jsFileHash = ''
  /** inject css file hash */
  let cssFileHash = ''
  const cssFileSource = readFileSync(
    `${resolve(get__Dirname(), INJECT_STYLE_FILE_NAME)}.css`,
    'utf8',
  ).toString()
  cssFileHash = getFileHash(cssFileSource)

  let jsFileSource = ''

  return {
    name: 'vue-vite-web-update-notice',
    apply: 'build',
    enforce: 'post',
    async configResolved(resolvedConfig: ResolvedConfig) {
      // 存储最终解析的配置
      viteConfig = resolvedConfig
      if (options.injectFileBase === undefined) options.injectFileBase = viteConfig.base

      jsFileSource = generateJsFileContent(
        readFileSync(`${resolve(get__Dirname(), INJECT_SCRIPT_FILE_NAME)}.js`, 'utf8').toString(),
        version,
        options,
      )
      jsFileHash = getFileHash(jsFileSource)

      // viteVersion = await getViteVersion()
    },
    generateBundle(_) {
      if (!version) return

      // inject version json file
      this.emitFile({
        type: 'asset',
        name: JSON_FILE_NAME,
        source: generateJSONFileContent(version, silence),
        fileName: `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`,
      })

      // inject css file
      if (!options.hiddenDefaultNotification) {
        this.emitFile({
          type: 'asset',
          name: INJECT_STYLE_FILE_NAME,
          source: cssFileSource,
          fileName: `${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`,
        })
      }

      // inject js file
      this.emitFile({
        type: 'asset',
        name: INJECT_SCRIPT_FILE_NAME,
        source: jsFileSource,
        fileName: `${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`,
      })
    },
    transformIndexHtml:
      // if the viteVersion is undefined, we assume that vite is less than v3.0（after v3.0, vite export version）
      // viteVersion === undefined
      //   ? {

      {
        order: 'post',
        handler(html: string, { chunk }) {
          if (version && chunk)
            return injectPluginHtml(html, version, options, { jsFileHash, cssFileHash })
          return html
        },
        enforce: 'post', // deprecated since Vite 4
        async transform(html: string) {
          // deprecated since Vite 4
          if (version) return injectPluginHtml(html, version, options, { jsFileHash, cssFileHash })
          return html
        },
      },
  }
}
