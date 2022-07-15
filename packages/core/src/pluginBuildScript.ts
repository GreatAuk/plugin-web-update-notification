import { resolve } from 'path'
import { copyFileSync } from 'fs'
import { name as pkgName } from '../package.json'
import { INJECT_SCRIPT_FILE_NAME, INJECT_STYLE_FILE_NAME } from './constant'

const scriptFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_SCRIPT_FILE_NAME}.js`)
const styleFilePath = resolve('node_modules', pkgName, 'dist', `${INJECT_STYLE_FILE_NAME}.css`)

// copy file from @plugin-web-update-notification/core/dist/??.js */ to dist/
copyFileSync(scriptFilePath, `dist/${INJECT_SCRIPT_FILE_NAME}.js`)

// copy file from @plugin-web-update-notification/core/dist/??.css */ to dist/
copyFileSync(styleFilePath, `dist/${INJECT_STYLE_FILE_NAME}.css`)
