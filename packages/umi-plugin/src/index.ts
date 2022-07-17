import { resolve } from 'path'
import { copyFileSync, readFileSync, writeFileSync } from 'fs'
import type { IApi } from 'umi'
import type { Options } from '@plugin-web-update-notification/core'
import { INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME, generateJSONFileContent, getVersion } from '@plugin-web-update-notification/core'
// import html from 'html-webpack'
import { name as pkgName } from '../package.json'

export type { Options } from '@plugin-web-update-notification/core'

const logVersionTpl = (version: string) => {
  return `
(function() {
  console.log('version: %c${version}', 'color: #1890ff');
})();`
}

export function generateScriptContent(options: Options, version: string) {
  const filePath = resolve('node_modules', pkgName, 'dist', `${INJECT_SCRIPT_FILE_NAME}.js`)
  return `${readFileSync(filePath, 'utf8').toString()}
  window.web_version_by_plugin = "${version}";
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
          /** whether to output version in console */
          logVersion: Joi.boolean(),
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
  const { logVersion, customNotificationHTML, hiddenDefaultNotification } = webUpdateNotificationOptions

  const version = getVersion()

  // 插件只在生产环境时生效
  if (!version || api.env !== 'production')
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
    if (logVersion) {
      scriptList.push({
        content: logVersionTpl(version),
      })
    }
    return scriptList
  })

  api.onBuildComplete(() => {
    // copy file from @plugin-web-update-notification/core/dist/??.css */ to dist/
    const cssFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_STYLE_FILE_NAME}.css`)
    copyFileSync(cssFilePath, `dist/${INJECT_STYLE_FILE_NAME}.css`)

    // write js file to dist/
    writeFileSync(`dist/${INJECT_SCRIPT_FILE_NAME}.js`, generateScriptContent(webUpdateNotificationOptions, version))

    // write version json file to dist/
    writeFileSync(`dist/${JSON_FILE_NAME}.json`, generateJSONFileContent(version))
  })

  api.modifyHTML(($) => {
    if (!hiddenDefaultNotification)
      $('body').append(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div></body>`)

    $('body').append(`<script type="module" crossorigin src="${INJECT_SCRIPT_FILE_NAME}.js"></script>`)
    return $
  })
}
