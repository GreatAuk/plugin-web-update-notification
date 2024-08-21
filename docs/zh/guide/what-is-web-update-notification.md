# What is plugin-web-update-notification ?

<p class="flex items-center">
    <a href="https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js" target="__blank">
      <img src="https://img.badgesize.io/https://unpkg.com/@plugin-web-update-notification/core/dist/webUpdateNoticeInjectScript.js?compression=gzip&style=flat-square" alt="Gzip Size" />
    </a>
    <a href="https://www.npmjs.com/package/@plugin-web-update-notification/core" target="__blank">
      <img src="https://img.shields.io/npm/v/@plugin-web-update-notification/core.svg?style=flat-square&colorB=51C838" alt="NPM Version" />
    </a>
    <a href="https://www.npmjs.com/package/@plugin-web-update-notification/core" target="__blank"><img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@plugin-web-update-notification/core?color=50a36f&label="></a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/blob/master/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square" alt="License" />
    </a>
    <a href="https://github.com/GreatAuk/plugin-web-update-notification/discussions" target="__blank">
      <img src="https://img.shields.io/badge/discussions-on%20github-blue?style=flat-square&colorB=51C838" alt="discussions-image" />
    </a>
    <br>
</p>

检测网页更新并通知用户刷新，支持 vite、umijs 和 webpack 插件。

> 以 git commit hash (也支持 svn revision number、package.json version、build timestamp、custom) 为版本号，打包时将版本号写入 json 文件。客户端轮询服务器上的版本号（浏览器窗口的 visibilitychange、focus 事件辅助），和本地作比较，如果不相同则通知用户刷新页面。

<p class="flex">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_umi_example.webp">
</p>

**什么时候会检测更新(fetch version.json)**  ?

1. 首次加载页面。
2. 轮询 （default: 10 * 60 * 1000 ms）。
3. script 脚本资源加载失败 (404 ?)。
4. 标签页 refocus or revisible。

## Why use plugin-web-update-notification ?

部分用户（老板）没有关闭网页的习惯，在网页有新版本更新或问题修复时，用户继续使用旧的版本，影响用户体验和后端数据准确性。也有可能会出现报错（文件404）、白屏的情况。
