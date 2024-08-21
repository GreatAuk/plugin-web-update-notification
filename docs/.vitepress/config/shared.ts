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

  themeConfig: {
    logo: { src: '/vitepress-logo-mini.svg', width: 24, height: 24 },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/GreatAuk/plugin-web-update-notification' },
    ],

  },
  vite: viteConfig as UserConfig,
})
