import { defineConfig } from 'tsup'
import { INJECT_SCRIPT_FILE_NAME } from './src/constant'

export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      index: 'src/index.ts',
      [INJECT_SCRIPT_FILE_NAME.replace('.global', '')]: 'src/injectScript.ts',
      pluginBuildScript: 'src/pluginBuildScript.ts',
    },
    target: 'es6',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm', 'cjs', 'iife'],
    minify: !options.watch,
    onSuccess: 'cp -a public/. dist & tsx ./src/buildScript.ts',
  }
})
