import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'
import type { Options } from '@plugin-web-update-notification/core'
import {
  INJECT_SCRIPT_FILE_NAME,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  generateJSONFileContent,
  getVersion,
  get__Dirname,
} from '@plugin-web-update-notification/core'

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

export function webUpdateNotice(options: Options = {}): Plugin {
  // let viteConfig: ResolvedConfig;
  return {
    name: 'vue-vite-web-update-notice',
    apply: 'build',
    enforce: 'post',
    // configResolved(resolvedConfig: ResolvedConfig) {
    //   // 存储最终解析的配置
    //   viteConfig = resolvedConfig;
    // },
    generateBundle(_, bundle = {}) {
      const version = getVersion()
      if (!version)
        return

      // inject version json file
      bundle[JSON_FILE_NAME] = {
        isAsset: true,
        type: 'asset',
        name: undefined,
        source: generateJSONFileContent(version),
        fileName: `${JSON_FILE_NAME}.json`,
      }
      // inject css file
      bundle[INJECT_STYLE_FILE_NAME] = {
        isAsset: true,
        type: 'asset',
        name: undefined,
        source: readFileSync(`${resolve(get__Dirname(), INJECT_STYLE_FILE_NAME)}.css`, 'utf8').toString(),
        fileName: `${INJECT_STYLE_FILE_NAME}.css`,
      }
      // inject js file
      bundle[INJECT_SCRIPT_FILE_NAME] = {
        isAsset: true,
        type: 'asset',
        name: undefined,
        source:
        `${readFileSync(`${resolve(get__Dirname(), INJECT_SCRIPT_FILE_NAME)}.js`, 'utf8').toString()}
        webUpdateCheck_checkAndNotice(${JSON.stringify(options)});`,
        fileName: `${INJECT_SCRIPT_FILE_NAME}.js`,
      }
    },
    transformIndexHtml: {
      enforce: 'post',
      transform(html: string) {
        const version = getVersion()
        if (version)
          return injectPluginHtml(html, version, options)
        return html
      },
    },
  }
}
