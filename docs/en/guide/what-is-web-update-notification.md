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

Detect webpage updates and notify user to reload. support vite, umijs and webpack.

> Take the git commit hash (also support svn revision number、package.json version、build timestamp、custom) as the version number, and write version into json file. The client polls the version of the server (visibilitychange or focus event assistant), compares it with the local one, and if it is not the same, notifies the user to refresh the page (you can custom behavior).

<p class="flex">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/vue_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/svelte_example.webp">
  <img width="180" src="https://raw.githubusercontent.com/GreatAuk/plugin-web-update-notification/master/images/react_umi_example.webp">
</p>

**When to check for updates (fetch version.json)** ?

1. first load page.
2. poll (default: 10 _60_ 1000 ms).
3. script resource loading failure detected (404 ?).
4. when the tab page is refocus or revisible.

## Why use plugin-web-update-notification ?

Some users do not have the habit of closing web pages. If the front-end page is updated, the user page has always been a historical version, any there may be report an error (file 404) or a white screen.
