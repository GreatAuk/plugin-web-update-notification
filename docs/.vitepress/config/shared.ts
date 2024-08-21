import type { UserConfig } from 'vitepress'
import { defineConfig } from 'vitepress'
import viteConfig from '../vite.config'

export const shared = defineConfig({
  title: 'WebUpdateNotice',

  rewrites: {
    'en/:rest*': ':rest*',
  },

  lastUpdated: true,
  cleanUrls: true,
  metaChunk: true,

  markdown: {
    math: true,
    codeTransformers: [
      // We use `[!!code` in demo to prevent transformation, here we revert it back.
      {
        postprocess(code) {
          return code.replace(/\[\!\!code/g, '[!code')
        },
      },
    ],
  },
  themeConfig: {
    logo: { src: '/vitepress-logo-mini.svg', width: 24, height: 24 },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],

  },
  vite: viteConfig as UserConfig,
})
