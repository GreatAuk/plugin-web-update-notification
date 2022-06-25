import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'
import type { Options } from '@web-update-notification/core'
import {
  INJECT_SCRIPT_FILE_NAME,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  generateJSONFileContent,
  getGitCommitHash,
  get__Dirname,
} from '@web-update-notification/core'

/**
 * It injects the hash into the HTML, and injects the notification anchor and the stylesheet and the
 * script into the HTML
 * @param {string} html - The original HTML of the page
 * @param {string} hash - The hash of the current commit
 * @param {Options} options - Options
 * @returns The html of the page with the injected script and css.
 */
function injectPluginHtml(html: string, hash: string, options: Options) {
  const { logHash, customNotificationHTML, hiddenDefaultNotification } = options

  const logHtml = logHash ? `<script>console.log('git-commit-hash: %c${hash}', 'color: #1890ff');</script>` : ''
  const cssLinkHtml = customNotificationHTML || hiddenDefaultNotification ? '' : `<link rel="stylesheet" href="${INJECT_STYLE_FILE_NAME}.css">`
  let res = html

  res = res.replace(
    '</head>',
    `${cssLinkHtml}
    <script type="module" crossorigin src="${INJECT_SCRIPT_FILE_NAME}.js"></script>
    ${logHtml}
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
      const commitHash = getGitCommitHash()
      if (commitHash) {
        // inject commit hash json file
        bundle[JSON_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source: generateJSONFileContent(commitHash),
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
          window.GIT_COMMIT_HASH = "${commitHash}";
          webUpdateCheck_checkAndNotice(${JSON.stringify(options)});`,
          fileName: `${INJECT_SCRIPT_FILE_NAME}.js`,
        }
      }
    },
    transformIndexHtml: {
      enforce: 'post',
      transform(html: string) {
        const commitHash = getGitCommitHash()
        if (commitHash)
          return injectPluginHtml(html, commitHash, options)
        return html
      },
    },
  }
}
