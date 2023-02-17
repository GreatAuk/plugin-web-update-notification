import { resolve } from 'path'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { IApi } from 'umi'
import type { Options } from '@plugin-web-update-notification/core'
import { DIRECTORY_NAME, INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME, JSON_FILE_NAME, NOTIFICATION_ANCHOR_CLASS_NAME, generateJSONFileContent, getVersion } from '@plugin-web-update-notification/core'
import { name as pkgName } from '../package.json'

export type { Options } from '@plugin-web-update-notification/core'

const logVersionTpl = (version: string) => {
  return `console.log('version: %c${version}', 'color: #1890ff');`
}

const injectVersionTpl = (version: string) => {
  return `window.pluginWebUpdateNotice_version = '${version}';`
}

export function generateScriptContent(options: Options) {
  const filePath = resolve('node_modules', pkgName, 'dist', `${INJECT_SCRIPT_FILE_NAME}.js`)
  return `${readFileSync(filePath, 'utf8').toString()}
  window.pluginWebUpdateNotice_.checkUpdate(${JSON.stringify(options)});`
}

export default (api: IApi) => {
  api.describe({
    key: 'webUpdateNotification',
    config: {
      schema(Joi) {
        return Joi.object({
          versionType: Joi.string(),
          /** polling interval（ms）, default 10*60*1000 */
          checkInterval: Joi.number(),
          /** whether to output version in console */
          logVersion: Joi.boolean(),
          injectFileBase: Joi.string(),
          customNotificationHTML: Joi.string(),
          notificationProps: {
            title: Joi.string(),
            description: Joi.string(),
            buttonText: Joi.string(),
            dismissButtonText: Joi.string(),
          },
          locale: Joi.string(),
          localeData: Joi.object(),
          hiddenDefaultNotification: Joi.boolean(),
          hiddenDismissButton: Joi.boolean(),
        })
      },
    },
    enableBy() {
      return api.env === 'production' && api?.userConfig.webUpdateNotification
    },
  })
  const webUpdateNotificationOptions = (api.userConfig?.webUpdateNotification || {}) as Options
  if (webUpdateNotificationOptions.injectFileBase === undefined)
    webUpdateNotificationOptions.injectFileBase = api.userConfig.publicPath || '/'

  const { versionType, logVersion, customNotificationHTML, hiddenDefaultNotification, injectFileBase = '', customVersion } = webUpdateNotificationOptions

  let version = ''
  if (versionType === 'custom')
    version = getVersion(versionType, customVersion!)
  else
    version = getVersion(versionType!)

  // 插件只在生产环境时生效
  if (!version || api.env !== 'production')
    return

  api.addHTMLLinks(() => {
    if (customNotificationHTML || hiddenDefaultNotification)
      return []

    return [
      {
        rel: 'stylesheet',
        href: `${injectFileBase}${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.css`,
      },
    ]
  })

  api.addHTMLHeadScripts(() => {
    const scriptList = []
    if (logVersion) {
      scriptList.push({
        content: logVersionTpl(version),
      })
    }
    scriptList.push({
      content: injectVersionTpl(version),
    })
    scriptList.push({
      src: `${injectFileBase}${INJECT_SCRIPT_FILE_NAME}.js`,
    })
    return scriptList
  })

  api.onBuildComplete(() => {
    mkdirSync(`dist/${DIRECTORY_NAME}`)

    // copy file from @plugin-web-update-notification/core/dist/??.css */ to dist/
    const cssFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_STYLE_FILE_NAME}.css`)
    copyFileSync(cssFilePath, `dist/${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.css`)

    // write js file to dist/
    writeFileSync(`dist/${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.js`, generateScriptContent(webUpdateNotificationOptions))

    // write version json file to dist/
    writeFileSync(`dist/${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`, generateJSONFileContent(version))
  })

  api.modifyHTML(($) => {
    if (!hiddenDefaultNotification)
      $('body').append(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`)
    return $
  })
}
