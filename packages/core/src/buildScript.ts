import { resolve } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

import { INJECT_SCRIPT_FILE_NAME } from './constant'

/**
 * remove injectScript file sourcemap comment
 */
function removeSourcemapComment() {
  const path = resolve(process.cwd(), `./dist/${INJECT_SCRIPT_FILE_NAME}.js`)
  const injectScript = readFileSync(path, 'utf-8',
  ).replace(/\n\/\/# sourceMappingURL=.*$/, '')
  // write file
  writeFileSync(path, injectScript, 'utf-8')
}

removeSourcemapComment()
