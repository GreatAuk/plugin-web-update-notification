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
    // `@nuxt/schema` is augmented via `declare module` for the `webUpdateNotification`
    // config key. Without excluding it from bundling, the dts bundler inlines its full
    // type graph (including `nuxt`/`webpack`/`postcss`/etc.) into this package's `.d.mts`.
    deps: {
      neverBundle: ['@nuxt/schema'],
    },
  }
})
