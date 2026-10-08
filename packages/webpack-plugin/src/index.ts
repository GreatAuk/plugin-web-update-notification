/* eslint-disable @typescript-eslint/ban-ts-comment */
import { accessSync, constants, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
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
import type { Compilation, Compiler } from 'webpack'

const pluginName = 'WebUpdateNotificationPlugin'

type PluginOptions = Options & {
  /** index.html file path, by default, we will look up path.resolve(webpackOutputPath, './index.html') */
  indexHtmlFilePath?: string
}

/**
 * It injects the hash into the HTML, and injects the notification anchor and the stylesheet and the
 * script into the HTML
 * @param {string} html - The original HTML of the page
 * @param {string} version - The hash of the current commit
 * @param {Options} options - Options
 * @returns The html of the page with the injected script and css.
 */
function injectPluginHtml(
  html: string,
  version: string,
  options: Options,
  { cssFileHash, jsFileHash }: { jsFileHash: string; cssFileHash: string },
) {
  const { customNotificationHTML, hiddenDefaultNotification, injectFileBase = '/' } = options

  const cssLinkHtml =
    customNotificationHTML || hiddenDefaultNotification
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
    res = res.replace('</body>', `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`)
  }

  return res
}

class WebUpdateNotificationPlugin {
  options: PluginOptions
  constructor(options: PluginOptions) {
    this.options = options || {}
  }

  apply(compiler: Compiler) {
    /** inject script file hash */
    let jsFileHash = ''
    /** inject css file hash */
    let cssFileHash = ''

    const { publicPath } = compiler.options.output
    if (this.options.injectFileBase === undefined)
      this.options.injectFileBase = typeof publicPath === 'string' ? publicPath : '/'

    const { hiddenDefaultNotification, versionType, indexHtmlFilePath, customVersion, silence } =
      this.options
    let version = ''
    if (versionType === 'custom') version = getVersion(versionType, customVersion!)
    else version = getVersion(versionType!)

    const emitAssets = (emitAsset: (name: string, content: string) => void) => {
      const jsonFileContent = generateJSONFileContent(version, silence)
      emitAsset(`${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`, jsonFileContent)
      if (!hiddenDefaultNotification) {
        const injectStyleContent = readFileSync(
          `${get__Dirname()}/${INJECT_STYLE_FILE_NAME}.css`,
          'utf8',
        )
        cssFileHash = getFileHash(injectStyleContent)

        emitAsset(
          `${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`,
          injectStyleContent,
        )
      }

      const filePath = resolve(`${get__Dirname()}/${INJECT_SCRIPT_FILE_NAME}.js`)
      const injectScriptContent = generateJsFileContent(
        readFileSync(filePath, 'utf8').toString(),
        version,
        this.options,
      )
      jsFileHash = getFileHash(injectScriptContent)

      emitAsset(
        `${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`,
        injectScriptContent,
      )
    }

    // Use the compiler's webpack instance; webpack 4 also exposes emitAsset in later releases.
    const webpack = compiler.webpack
    if (webpack && Number.parseInt(webpack.version, 10) >= 5) {
      compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
        compilation.hooks.processAssets.tap(
          { name: pluginName, stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
          () => {
            emitAssets((name, content) => {
              compilation.emitAsset(name, new webpack.sources.RawSource(content))
            })
          },
        )
      })
    } else {
      compiler.hooks.emit.tap(pluginName, (compilation: Compilation) => {
        emitAssets((name, content) => {
          // @ts-expect-error webpack 4 accepts source/size assets without webpack 5 Source methods
          compilation.assets[name] = { source: () => content, size: () => content.length }
        })
      })
    }

    compiler.hooks.afterEmit.tap(pluginName, () => {
      const htmlFilePath = resolve(compiler.outputPath, indexHtmlFilePath || './index.html')
      try {
        accessSync(htmlFilePath, constants.F_OK)

        let html = readFileSync(htmlFilePath, 'utf8')
        html = injectPluginHtml(html, version, this.options, {
          jsFileHash,
          cssFileHash,
        })
        writeFileSync(htmlFilePath, html)
      } catch (error) {
        console.error(error)
        console.error(
          `${pluginName} failed to inject the plugin into the HTML file. index.html（${htmlFilePath}） not found.`,
        )
      }
    })
  }
}

export { WebUpdateNotificationPlugin }
