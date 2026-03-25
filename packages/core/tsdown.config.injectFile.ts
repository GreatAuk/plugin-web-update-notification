import { defineConfig } from 'tsdown'
// @ts-expect-error tsdown config runs via Node.js type stripping, .ts import is valid at runtime
import { INJECT_SCRIPT_FILE_NAME } from './src/constant.ts'

export default defineConfig((options) => {
  return {
    entry: {
      [INJECT_SCRIPT_FILE_NAME.replace('.iife', '')]: 'src/injectScript.ts',
    },
    target: 'es6',
    clean: false,
    sourcemap: false,
    format: ['esm', 'iife'],
    minify: !options.watch,
  }
})
