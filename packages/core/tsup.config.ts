import { defineConfig } from 'tsup'

export default defineConfig((options) => { // The options here is derived from CLI flags.
  return {
    entry: {
      index: 'src/index.ts',
      pluginBuildScript: 'src/pluginBuildScript.ts',
    },
    target: 'es2020',
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm', 'cjs'],
    minify: !options.watch,
    onSuccess: 'cp -a public/. dist',
  }
})
