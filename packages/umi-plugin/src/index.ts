import { resolve } from 'path'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'
import type { IApi } from 'umi'
import type { Options } from 'web-update-notification-core'
import { INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME, generateJSONFileContent, getGitCommitHash } from 'web-update-notification-core'
import { name as pkgName } from '../package.json'

export type { Options } from 'web-update-notification-core'

const logHashTpl = (commitHash: string) => {
  return `
(function() {
  console.log('git-commit-hash: %c${commitHash}', 'color: #1890ff');
})();`
}

export function generateScriptContent(options: Options, commitHash: string) {
  const filePath = resolve('node_modules', pkgName, 'dist', `${INJECT_SCRIPT_FILE_NAME}.js`)
  return `${readFileSync(filePath, 'utf8').toString()}
  window.GIT_COMMIT_HASH = "${commitHash}";
  webUpdateCheck_checkAndNotice(${JSON.stringify(options)});`
}

export default (api: IApi) => {
  api.describe({
    key: 'webUpdateNotification',
    config: {
      schema(Joi) {
        return Joi.object({
          /** polling interval（ms）, default 10*60*1000 */
          checkInterval: Joi.number(),
          /** whether to output commit-hash in console */
          logHash: Joi.boolean(),
          customNotificationHTML: Joi.string(),
          notificationProps: {
            title: Joi.string(),
            description: Joi.string(),
            buttonText: Joi.string(),
          },
          hiddenDefaultNotification: Joi.boolean(),
        })
      },
    },
    enableBy() {
      return api.env === 'production' && api?.userConfig.webUpdateNotification
    },
  })
  const webUpdateNotificationOptions = (api.userConfig?.webUpdateNotification || {}) as Options
  const { logHash, customNotificationHTML, hiddenDefaultNotification } = webUpdateNotificationOptions

  const commitHash = getGitCommitHash()

  // 插件只在生产环境且仓库是 git 仓库时生效
  if (!commitHash || api.env !== 'production')
    return

  api.addHTMLLinks(() => {
    if (customNotificationHTML || hiddenDefaultNotification)
      return []

    return [
      {
        rel: 'stylesheet',
        href: `${INJECT_STYLE_FILE_NAME}.css`,
      },
    ]
  })

  api.addHTMLScripts(() => {
    const scriptList = []
    if (logHash) {
      scriptList.push({
        content: logHashTpl(commitHash),
      })
    }
    return scriptList
  })

  api.onBuildComplete(() => {
    // copy file from web-update-notification-core/dist/??.css */ to dist/
    const scriptFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_STYLE_FILE_NAME}.css`)
    copyFileSync(scriptFilePath, `dist/${INJECT_STYLE_FILE_NAME}.css`)

    // write js file to dist/
    writeFileSync(`dist/${INJECT_SCRIPT_FILE_NAME}.js`, generateScriptContent(webUpdateNotificationOptions, commitHash))

    // write version json file to dist/
    writeFileSync(`dist/${JSON_FILE_NAME}.json`, generateJSONFileContent(commitHash))
  })

  api.modifyHTML(($) => {
    if (!hiddenDefaultNotification)
      $('body').append(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`)

    $('body').append(`<script type="module" crossorigin src="${INJECT_SCRIPT_FILE_NAME}.js"></script>`)
    return $
  })
}
