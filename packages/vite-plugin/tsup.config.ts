import { resolve } from 'path'
import { defineConfig } from 'tsup'
import { pkgName } from '@plugin-web-update-notification/core'

export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      index: 'src/index.ts',
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm'],
    minify: !options.watch,
    // after bundle success, run script, copy inject file from @plugin-web-update-notification/core
    onSuccess: `node ${resolve('node_modules', pkgName, 'dist', 'pluginBuildScript.js')}`,
  }
})
