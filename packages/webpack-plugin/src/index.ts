/* eslint-disable @typescript-eslint/ban-ts-comment */
import { accessSync, constants, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Options } from '@plugin-web-update-notification/core'
import { DIRECTORY_NAME, INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME, generateJSONFileContent, getVersion, get__Dirname } from '@plugin-web-update-notification/core'
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
function injectPluginHtml(html: string, version: string, options: Options) {
  const { logVersion, customNotificationHTML, hiddenDefaultNotification, injectFileBase = '/' } = options

  const logHtml = logVersion ? `<script>console.log('version: %c${version}', 'color: #1890ff');</script>` : ''
  const versionScript = `<script>window.pluginWebUpdateNotice_version = '${version}';</script>`
  const cssLinkHtml = customNotificationHTML || hiddenDefaultNotification ? '' : `<link rel="stylesheet" href="${injectFileBase}${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.css">`
  let res = html

  res = res.replace(
    '<head>',
    `<head>
    ${cssLinkHtml}
    <script src="${injectFileBase}${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.js"></script>
    ${logHtml}
    ${versionScript}`,
  )

  if (!hiddenDefaultNotification) {
    res = res.replace(
      '</body>',
      `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`,
    )
  }

  return res
}

export function generateScriptContent(options: Options) {
  const filePath = resolve(`${get__Dirname()}/${INJECT_SCRIPT_FILE_NAME}.js`)
  return `${readFileSync(filePath, 'utf8').toString()}
  window.__checkUpdateSetup__(${JSON.stringify(options)});`
}

class WebUpdateNotificationPlugin {
  options: PluginOptions
  constructor(options: PluginOptions) {
    this.options = options || {}
  }

  apply(compiler: Compiler) {
    const { publicPath } = compiler.options.output
    if (this.options.injectFileBase === undefined)
      this.options.injectFileBase = typeof publicPath === 'string' ? publicPath : '/'

    const { hiddenDefaultNotification, versionType, indexHtmlFilePath, customVersion, silence } = this.options
    let version = ''
    if (versionType === 'custom')
      version = getVersion(versionType, customVersion!)
    else
      version = getVersion(versionType!)

    compiler.hooks.emit.tap(pluginName, (compilation: Compilation) => {
      // const outputPath = compiler.outputPath
      const jsonFileContent = generateJSONFileContent(version, silence)
      // @ts-expect-error
      compilation.assets[`${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`] = {
        source: () => jsonFileContent,
        size: () => jsonFileContent.length,
      }
      if (!hiddenDefaultNotification) {
        const injectStyleContent = readFileSync(`${get__Dirname()}/${INJECT_STYLE_FILE_NAME}.css`, 'utf8')
        // @ts-expect-error
        compilation.assets[`${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.css`] = {
          source: () => injectStyleContent,
          size: () => injectStyleContent.length,
        }
      }

      const injectScriptContent = generateScriptContent(this.options)
      // @ts-expect-error
      compilation.assets[`${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.js`] = {
        source: () => injectScriptContent,
        size: () => injectScriptContent.length,
      }
    })

    compiler.hooks.afterEmit.tap(pluginName, () => {
      const htmlFilePath = resolve(compiler.outputPath, indexHtmlFilePath || './index.html')
      try {
        accessSync(htmlFilePath, constants.F_OK)

        let html = readFileSync(htmlFilePath, 'utf8')
        html = injectPluginHtml(html, version, this.options)
        writeFileSync(htmlFilePath, html)
      }
      catch (error) {
        console.error(error)
        console.error(`${pluginName} failed to inject the plugin into the HTML file. index.html（${htmlFilePath}） not found.`)
      }
    })
  }
}

export { WebUpdateNotificationPlugin }
