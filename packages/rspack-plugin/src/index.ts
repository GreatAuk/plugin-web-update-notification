import { accessSync, constants, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Compiler, Compilation, RspackPluginInstance } from '@rspack/core'
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

const PLUGIN_NAME = 'WebUpdateNotificationPlugin'

type PluginOptions = Options & {
  /** index.html file path, by default, we will look up path.resolve(rspackOutputPath, './index.html') */
  indexHtmlFilePath?: string
}

class WebUpdateNotificationPlugin implements RspackPluginInstance {
  options: PluginOptions

  constructor(options: PluginOptions = {}) {
    this.options = options
  }

  apply(compiler: Compiler) {
    /** inject script file hash */
    let jsFileHash = ''
    /** inject css file hash */
    let cssFileHash = ''

    const { publicPath } = compiler.options.output
    if (this.options.injectFileBase === undefined)
      this.options.injectFileBase = typeof publicPath === 'string' ? publicPath : '/'

    const { hiddenDefaultNotification, versionType, customVersion, silence } = this.options
    let version = ''
    if (versionType === 'custom')
      version = getVersion(versionType, customVersion!)
    else
      version = getVersion(versionType!)

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      const { Compilation } = compiler.rspack

      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const { RawSource } = compiler.rspack.sources

          // emit version json file
          const jsonFileContent = generateJSONFileContent(version, silence)
          compilation.emitAsset(
            `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`,
            new RawSource(jsonFileContent),
          )

          // emit css file
          if (!hiddenDefaultNotification) {
            const injectStyleContent = readFileSync(
              `${get__Dirname()}/${INJECT_STYLE_FILE_NAME}.css`,
              'utf8',
            )
            cssFileHash = getFileHash(injectStyleContent)

            compilation.emitAsset(
              `${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`,
              new RawSource(injectStyleContent),
            )
          }

          // emit js file
          const filePath = resolve(`${get__Dirname()}/${INJECT_SCRIPT_FILE_NAME}.js`)
          const injectScriptContent = generateJsFileContent(
            readFileSync(filePath, 'utf8').toString(),
            version,
            this.options,
          )
          jsFileHash = getFileHash(injectScriptContent)

          compilation.emitAsset(
            `${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`,
            new RawSource(injectScriptContent),
          )
        },
      )
    })

    compiler.hooks.afterEmit.tap(PLUGIN_NAME, () => {
      const htmlFilePath = resolve(
        compiler.outputPath,
        this.options.indexHtmlFilePath || './index.html',
      )
      try {
        accessSync(htmlFilePath, constants.F_OK)

        let html = readFileSync(htmlFilePath, 'utf8')
        html = injectPluginHtml(html, version, this.options, { jsFileHash, cssFileHash })
        writeFileSync(htmlFilePath, html)
      }
      catch (error) {
        console.error(error)
        console.error(
          `${PLUGIN_NAME} failed to inject the plugin into the HTML file. index.html（${htmlFilePath}） not found.`,
        )
      }
    })
  }
}

/**
 * Fallback: inject tags directly into HTML string when HtmlRspackPlugin is not available
 */
function injectPluginHtml(
  html: string,
  version: string,
  options: Options,
  { cssFileHash, jsFileHash }: { jsFileHash: string; cssFileHash: string },
) {
  const { customNotificationHTML, hiddenDefaultNotification, injectFileBase = '/' } = options

  const cssLinkHtml = customNotificationHTML || hiddenDefaultNotification
    ? ''
    : `<link rel="stylesheet" href="${injectFileBase}${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css">`
  let res = html

  res = res.replace(
    '<head>',
    `<head>
    ${cssLinkHtml}
    <script data-id="${INJECT_SCRIPT_TAG_ID}" data-v="${version}" src="${injectFileBase}${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js"></script>`,
  )

  if (!hiddenDefaultNotification) {
    res = res.replace(
      '</body>',
      `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`,
    )
  }

  return res
}

export { WebUpdateNotificationPlugin }
export type { PluginOptions }
