import { resolve } from 'path'
import { defineConfig } from 'tsup'
import { pkgName } from '@web-update-notification/core'

export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      index: 'src/index.ts',
    },
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    minify: !options.watch,
    onSuccess: `node ${resolve('node_modules', pkgName, 'dist', 'pluginBuildScript.js')}`,
  }
})
