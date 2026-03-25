import { resolve } from 'path'
import { defineConfig } from 'tsdown'
import { pkgName } from '@plugin-web-update-notification/core'

export default defineConfig((options) => {
  return {
    entry: {
      index: 'src/index.ts',
    },
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm'],
    minify: !options.watch,
    // after bundle success, run script, copy inject file from @plugin-web-update-notification/core
    onSuccess: `node ${resolve('node_modules', pkgName, 'dist', 'pluginBuildScript.mjs')}`,
  }
})
