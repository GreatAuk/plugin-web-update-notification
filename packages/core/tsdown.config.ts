import { defineConfig } from 'tsdown'

export default defineConfig((options) => {
  return {
    entry: {
      index: 'src/index.ts',
      pluginBuildScript: 'src/pluginBuildScript.ts',
    },
    target: 'es2020',
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm', 'cjs'],
    minify: !options.watch,
    onSuccess: process.platform === 'win32' ? 'xcopy /E /I public\\ dist\\' : 'cp -a public/. dist',
  }
})
