import { accessSync, constants, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Compiler, Compilation, RspackPluginInstance } from '@rspack/core'
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
    // Only production builds are handled. The dev server keeps its output in memory, so there is
    // no index.html on disk to inject into, and in watch mode an unchanged index.html is not
    // re-emitted, so every rebuild would inject into the same file on disk again.
    // `mode` is undefined when not set, which rspack builds as production.
    if (compiler.options.mode === 'development') return

    /** inject script file hash */
    let jsFileHash = ''
    /** inject css file hash */
    let cssFileHash = ''

    const { publicPath } = compiler.options.output
    if (this.options.injectFileBase === undefined)
      this.options.injectFileBase = typeof publicPath === 'string' ? publicPath : '/'

    const { hiddenDefaultNotification, versionType, customVersion, silence } = this.options
    let version = ''
    if (versionType === 'custom') version = getVersion(versionType, customVersion!)
    else version = getVersion(versionType!)

    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation: Compilation) => {
      // watchMode is only known once compiler.watch() runs, after apply()
      if (compiler.watchMode) return
      const { Compilation } = compiler.rspack

      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          const { RawSource } = compiler.rspack.sources
          // `minimized` keeps minimizers (e.g. SwcJsMinimizerRspackPlugin) from processing these
          // files again, so they are emitted as generated
          const info = { minimized: true }

          // emit version json file
          const jsonFileContent = generateJSONFileContent(version, silence)
          compilation.emitAsset(
            `${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`,
            new RawSource(jsonFileContent),
            info,
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
              info,
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
            info,
          )
        },
      )
    })

    compiler.hooks.afterEmit.tap(PLUGIN_NAME, () => {
      if (compiler.watchMode) return
      const htmlFilePath = resolve(
        compiler.outputPath,
        this.options.indexHtmlFilePath || './index.html',
      )
      try {
        accessSync(htmlFilePath, constants.F_OK)

        let html = readFileSync(htmlFilePath, 'utf8')
        html = injectPluginHtml(html, version, this.options, { jsFileHash, cssFileHash })
        writeFileSync(htmlFilePath, html)
      } catch (error) {
        console.error(error)
        console.error(
          `${PLUGIN_NAME} failed to inject the plugin into the HTML file. index.html（${htmlFilePath}） not found.`,
        )
      }
    })
  }
}

export { WebUpdateNotificationPlugin }
export type { PluginOptions }
