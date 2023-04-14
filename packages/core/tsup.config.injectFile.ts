import { defineConfig } from 'tsup'
import { INJECT_SCRIPT_FILE_NAME } from './src/constant'

export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      [INJECT_SCRIPT_FILE_NAME.replace('.global', '')]: 'src/injectScript.ts',
    },
    target: 'es6',
    splitting: false,
    sourcemap: false,
    format: ['esm', 'iife'],
    minify: !options.watch,
  }
})
