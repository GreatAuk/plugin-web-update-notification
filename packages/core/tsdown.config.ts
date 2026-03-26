import { defineConfig } from 'tsdown'

export default defineConfig((options) => {
  return {
    entry: {
      index: 'src/index.ts',
    },
    target: 'es2020',
    sourcemap: true,
    clean: true,
    dts: true,
    format: ['esm', 'cjs'],
    minify: !options.watch,
    copy: ['public/**/*.css'],
  }
})
