import { readFileSync } from 'fs'
import { resolve } from 'path'
import { execSync } from 'child_process'
import type { Plugin } from 'vite'

import type { Options } from './type'

import {
  INJECT_SCRIPT_FILE_NAME,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
} from './constant'
export * from './constant'

/** A function that returns the hash of the current commit. */
function getGitCommitHash() {
  try {
    return execSync('git rev-parse --short HEAD').toString().replace('\n', '')
  }
  catch (err) {
    console.warn(`
======================================================
[vite-plugin-web-update-notice] Not a git repository !
======================================================
    `)
    return ''
  }
}

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

/**
 * generate json file for git commit hash
 * @param {string} hash - git commit hash
 * @returns A string
 */
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
        // inject commit hash json file
        bundle[JSON_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source: generateJSONFile(commitHash),
          fileName: `${JSON_FILE_NAME}.json`,
        }
        // inject css file
        bundle[INJECT_STYLE_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source: readFileSync(`${resolve(__dirname, INJECT_STYLE_FILE_NAME)}.css`, 'utf8').toString(),
          fileName: `${INJECT_STYLE_FILE_NAME}.css`,
        }
        // inject js file
        bundle[INJECT_SCRIPT_FILE_NAME] = {
          isAsset: true,
          type: 'asset',
          name: undefined,
          source:
          `${readFileSync(`${resolve(__dirname, INJECT_SCRIPT_FILE_NAME)}.js`, 'utf8').toString()}
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
