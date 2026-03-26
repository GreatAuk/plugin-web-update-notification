import { defineConfig } from 'tsdown'

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
  }
})
