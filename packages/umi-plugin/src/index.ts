import { resolve } from 'path'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import type { IApi } from 'umi'
import type { Options } from '@plugin-web-update-notification/core'
import {
  DIRECTORY_NAME,
  INJECT_SCRIPT_FILE_NAME,
  INJECT_STYLE_FILE_NAME,
  JSON_FILE_NAME,
  NOTIFICATION_ANCHOR_CLASS_NAME,
  generateJSONFileContent,
  generateJsFileContent,
  getFileHash,
  getVersion,
} from '@plugin-web-update-notification/core'
import { name as pkgName } from '../package.json'

export type { Options } from '@plugin-web-update-notification/core'

const injectVersionTpl = (version: string) => {
  return `window.pluginWebUpdateNotice_version = '${version}';`
}

export default (api: IApi) => {
  api.describe({
    key: 'webUpdateNotification',
    config: {
      schema(Joi) {
        return Joi.object({
          versionType: Joi.string(),
          customVersion: Joi.string(),
          /** polling interval（ms）, default 10*60*1000 */
          checkInterval: Joi.number(),
          /** whether to output version in console */
          logVersion: Joi.boolean(),
          checkOnWindowFocus: Joi.boolean(),
          checkImmediately: Joi.boolean(),
          checkOnLoadFileError: Joi.boolean(),
          injectFileBase: Joi.string(),
          customNotificationHTML: Joi.string(),
          notificationProps: {
            title: Joi.string(),
            description: Joi.string(),
            buttonText: Joi.string(),
            dismissButtonText: Joi.string(),
          },
          notificationConfig: {
            primaryColor: Joi.string(),
            secondaryColor: Joi.string(),
            placement: Joi.string(),
          },
          silence: Joi.boolean(),
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

  const { versionType, customNotificationHTML, hiddenDefaultNotification, injectFileBase = '', customVersion, silence } = webUpdateNotificationOptions

  let version = ''
  if (versionType === 'custom')
    version = getVersion(versionType, customVersion!)
  else
    version = getVersion(versionType!)

  // 插件只在生产环境时生效
  if (!version || api.env !== 'production')
    return

  const jsFlePath = resolve('node_modules', pkgName, 'dist', `${INJECT_SCRIPT_FILE_NAME}.js`)
  const jsFileContent = generateJsFileContent(
    readFileSync(jsFlePath, 'utf8').toString(),
    version,
    webUpdateNotificationOptions,
  )
  /** inject script file hash */
  const jsFileHash = getFileHash(jsFileContent)

  const cssFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_STYLE_FILE_NAME}.css`)
  /** inject css file hash */
  const cssFileHash = getFileHash(readFileSync(cssFilePath, 'utf8').toString())

  api.addHTMLLinks(() => {
    if (customNotificationHTML || hiddenDefaultNotification)
      return []

    return [
      {
        rel: 'stylesheet',
        href: `${injectFileBase}${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`,
      },
    ]
  })

  api.addHTMLHeadScripts(() => {
    const scriptList = []
    scriptList.push({
      content: injectVersionTpl(version),
    })
    scriptList.push({
      src: `${injectFileBase}${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`,
    })
    return scriptList
  })

  api.onBuildComplete(() => {
    const outputPath = resolve(api.userConfig.outputPath || 'dist')
    mkdirSync(`${outputPath}/${DIRECTORY_NAME}`)

    // copy file from @plugin-web-update-notification/core/dist/??.css */ to dist/
    copyFileSync(cssFilePath, `${outputPath}/${DIRECTORY_NAME}/${INJECT_STYLE_FILE_NAME}.${cssFileHash}.css`)

    // write js file to dist/
    writeFileSync(`${outputPath}/${DIRECTORY_NAME}/${INJECT_SCRIPT_FILE_NAME}.${jsFileHash}.js`, jsFileContent)

    // write version json file to dist/
    writeFileSync(`${outputPath}/${DIRECTORY_NAME}/${JSON_FILE_NAME}.json`, generateJSONFileContent(version, silence))
  })

  api.modifyHTML(($) => {
    if (!hiddenDefaultNotification)
      $('body').append(`<div class="${NOTIFICATION_ANCHOR_CLASS_NAME}"></div>`)
    return $
  })
}
