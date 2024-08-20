import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'

import UnoCSS from 'unocss/vite'

const require = createRequire(import.meta.url)

export default defineConfig({
  server: {
    fs: {
      allow: [
        resolve(__dirname, '..'),
      ],
    },
  },
  plugins: [

    UnoCSS(),

  ],
  resolve: {
    alias: {
      '@plugin-web-update-notification/core': resolve(__dirname, '../core/src/index.ts'),
      '@plugin-web-update-notification/umi': resolve(__dirname, '../umi-plugin/src/index.ts'),
      '@plugin-web-update-notification/vite': resolve(__dirname, '../vite-plugin/src/index.ts'),
      '@plugin-web-update-notification/webpack': resolve(__dirname, '../webpack-plugin/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@plugin-web-update-notification/core',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@plugin-web-update-notification/'))
            return 'plugin-web-update-notification'
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        require('postcss-nested'),
      ],
    },
  },
})
