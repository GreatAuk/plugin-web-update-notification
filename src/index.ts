import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

import type { Options } from './type'
import {
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
} from './constant'
import {
  getGitCommitHash,
  webUpdateCheck_checkAndNotice,
  webUpdateCheck_showNotification,
} from './script'

/**
 * It takes a string of HTML and a string of a git commit hash, and returns a string of HTML with a
 * script tag appended to the end that sets a global variable with the git commit hash
 * @param {string} html - The HTML that will be injected into the page.
 * @param {string} hash - The hash of the current commit.
 * @returns A function that takes two arguments, html and hash, and returns a string.
 */
function injectScriptHtml(html: string, hash: string, options: Options) {
  const { logHash, customNotificationHTML } = options
  const checkHtml = `
    window.GIT_COMMIT_HASH = "${hash}";
    ${webUpdateCheck_checkAndNotice.toString()}
    ${webUpdateCheck_checkAndNotice.name}(${JSON.stringify(options)})
    ${webUpdateCheck_showNotification.toString()}
  `
  const logHtml = `${
    logHash
      ? `console.log('git-commit-hash: %c${hash}', 'color: #1890ff');`
      : ''
  }`

  const bindRefreshEvent = `
const anchor = document.querySelector('.${NOTIFICATION_ANCHOR_CLASS_NAME}');
anchor.addEventListener('click', () => {
  window.location.reload()
});`

  let res = `
    ${html}
    <script>${checkHtml}${logHtml}${bindRefreshEvent}
    </script>
  `
  if (!customNotificationHTML) {
    res = res.replace(
      '</head>',
      `<link rel="stylesheet" href="${INJECT_STYLE_FILE_NAME}">`,
    )
  }
  res = res.replace(
    '</body>',
    `<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`,
  )
  return res
}

function generateJSONFile(hash: string) {
  return `
{
  "hash": "${hash}"
}`.replace('\n', '')
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
    generateBundle(_: any, bundle: any = {}) {
      const commitHash = getGitCommitHash()
      if (commitHash) {
        bundle[JSON_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source: generateJSONFile(commitHash),
          fileName: JSON_FILE_NAME,
        }
        bundle[INJECT_STYLE_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source: readFileSync(resolve(__dirname, INJECT_STYLE_FILE_NAME), 'utf8').toString(),
          fileName: INJECT_STYLE_FILE_NAME,
        }
      }
    },
    transformIndexHtml: {
      enforce: 'post',
      transform(html: string) {
        const commitHash = getGitCommitHash()
        if (commitHash)
          return injectScriptHtml(html, commitHash, options)

        return html
      },
    },
  }
}
