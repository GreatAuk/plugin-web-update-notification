/* eslint-disable @typescript-eslint/ban-ts-comment */
import { accessSync, constants, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Options } from '@plugin-web-update-notification/core'
import { INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME, generateJSONFileContent, getVersion, get__Dirname } from '@plugin-web-update-notification/core'
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
  const { logVersion, customNotificationHTML, hiddenDefaultNotification, injectFileBase = '' } = options

  const logHtml = logVersion ? `<script>console.log('version: %c${version}', 'color: #1890ff');</script>` : ''
  const versionScript = `<script>window.web_version_by_plugin = '${version}';</script>`
  const cssLinkHtml = customNotificationHTML || hiddenDefaultNotification ? '' : `<link rel="stylesheet" href="${injectFileBase}${INJECT_STYLE_FILE_NAME}.css">`
  let res = html

  res = res.replace(
    '</head>',
    `${cssLinkHtml}
    <script defer src="${injectFileBase}${INJECT_SCRIPT_FILE_NAME}.js"></script>
    ${logHtml}
    ${versionScript}
  </head>
    `,
  )

  if (!hiddenDefaultNotification) {
    res = res.replace(
      '</body>',
      `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`,
    )
  }

  return res
}

export function generateScriptContent(options: Options, version: string) {
  const filePath = resolve(`${get__Dirname()}/${INJECT_SCRIPT_FILE_NAME}.js`)
  return `${readFileSync(filePath, 'utf8').toString()}
  window.web_version_by_plugin = "${version}";
  webUpdateCheck_checkAndNotice(${JSON.stringify(options)});`
}

class WebUpdateNotificationPlugin {
  options: PluginOptions
  constructor(options: PluginOptions) {
    this.options = options
  }

  apply(compiler: Compiler) {
    compiler.hooks.emit.tap(pluginName, (compilation: Compilation) => {
      // const outputPath = compiler.outputPath
      const { hiddenDefaultNotification } = this.options

      const version = getVersion()

      const jsonFileContent = generateJSONFileContent(version)
      // @ts-expect-error
      compilation.assets[`${JSON_FILE_NAME}.json`] = {
        source: () => jsonFileContent,
        size: () => jsonFileContent.length,
      }
      if (!hiddenDefaultNotification) {
        const injectStyleContent = readFileSync(`${get__Dirname()}/${INJECT_STYLE_FILE_NAME}.css`, 'utf8')
        // @ts-expect-error
        compilation.assets[`${INJECT_STYLE_FILE_NAME}.css`] = {
          source: () => injectStyleContent,
          size: () => injectStyleContent.length,
        }
      }

      const injectScriptContent = generateScriptContent(this.options, version)
      // @ts-expect-error
      compilation.assets[`${INJECT_SCRIPT_FILE_NAME}.js`] = {
        source: () => injectScriptContent,
        size: () => injectScriptContent.length,
      }
    })

    compiler.hooks.afterEmit.tap(pluginName, () => {
      const { indexHtmlFilePath } = this.options
      const htmlFilePath = resolve(compiler.outputPath, indexHtmlFilePath || './index.html')
      try {
        accessSync(htmlFilePath, constants.F_OK)

        const version = getVersion()
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
