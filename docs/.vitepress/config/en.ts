import { createRequire } from 'module'
import { type DefaultTheme, defineConfig } from 'vitepress'

const require = createRequire(import.meta.url)
const pkg = require('../../../package.json')

export const en = defineConfig({
  lang: 'en-US',
  description: 'Detect webpage updates and notify user to reload. support vite, umijs and webpack.',

  themeConfig: {
    nav: nav(),

    sidebar: {
      '/guide/': { base: '/guide/', items: sidebarGuide() },
      '/reference/': { base: '/reference/', items: sidebarReference() },
    },

    editLink: {
      pattern: 'https://github.com/vuejs/vitepress/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
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
      text: 'Guide',
      link: '/guide/what-is-web-update-notification',
      activeMatch: '/guide/',
    },
    {
      text: 'Reference',
      link: '/reference/api',
      activeMatch: '/reference/',
    },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/vuejs/vitepress/blob/main/.github/contributing.md',
        },
      ],
    },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'What\'s Web Update Notify?', link: 'what-is-web-update-notification' },
        { text: 'Getting Started', link: 'getting-started' },
      ],
    },

    {
      text: 'Usage',
      base: '/guide/with-',
      items: [
        { text: 'Vite', link: 'vite' },
        { text: 'UmiJS', link: 'umijs' },
        { text: 'Webpack', link: 'webpack' },
      ],
    },

    {
      text: 'Advanced',
      base: '/guide/advanced-',
      items: [
        { text: 'I18n', link: 'i18n' },
        { text: 'Custom Text', link: 'custom-text' },
        { text: 'Custom Event', link: 'custom-event' },
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
      base: '/reference/',
      link: 'faq',
    },
  ]
}
