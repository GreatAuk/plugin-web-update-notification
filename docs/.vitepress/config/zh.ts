import { type DefaultTheme, defineConfig } from 'vitepress'

// const require = createRequire(import.meta.url)
// const pkg = require('../../../package.json')

export const zh = defineConfig({
  lang: 'zh-Hans',
  description: '检测网页更新并通知用户刷新，支持 vite、umijs 和 webpack 插件。',

  themeConfig: {
    nav: nav(),

    sidebar: {
      '/zh/guide/': { base: '/zh/guide/', items: sidebarGuide() },
      '/zh/reference/': { base: '/zh/reference/', items: sidebarReference() },
    },

    editLink: {
      pattern: 'https://github.com/GreatAuk/plugin-web-update-notification/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页面',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present WebUpdateNotification',
    },
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '指南',
      link: '/zh/guide/what-is-web-update-notification',
      activeMatch: '/zh/guide/',
    },
    {
      text: '参考',
      link: '/zh/reference/api',
      activeMatch: '/zh/reference/',
    },
    // {
    //   text: pkg.version,
    //   link: 'https://www.npmjs.com/package/plugin-web-update-notification',
    // },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '简介',
      collapsed: false,
      items: [
        { text: '什么是 WebUpdateNotify?', link: 'what-is-web-update-notification' },
        { text: '快速开始', link: 'getting-started' },
      ],
    },

    {
      text: '使用',
      base: '/zh/guide/with-',
      items: [
        { text: 'Vite', link: 'vite' },
        { text: 'UmiJS', link: 'umijs' },
        { text: 'Webpack', link: 'webpack' },
      ],
    },

    {
      text: '进阶',
      base: '/zh/guide/advanced-',
      items: [
        { text: '国际化', link: 'i18n' },
        { text: '自定义提示文字', link: 'custom-text' },
        { text: '事件', link: 'custom-event' },
      ],
    },

  ]
}

function sidebarReference(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'API',
      items: [
        { text: 'Options & Functions', link: 'api' },
      ],
    },

    {
      text: 'FAQ',
      base: '/zh/reference/',
      link: 'faq',
    },
  ]
}
