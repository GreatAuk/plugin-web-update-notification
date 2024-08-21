# FAQ

1. `TypeScript` 的智能提示, 如果你想使用 `window.pluginWebUpdateNotice_.` 或监听自定义更新事件。

   ```ts
   // src/shim.d.ts

   // if you use vite plugin
   /// <reference types="@plugin-web-update-notification/vite" />

   // if you use umi plugin
   /// <reference types="@plugin-web-update-notification/umijs" />

   // if you use webpack plugin
   /// <reference types="@plugin-web-update-notification/webpack" />
   ```

2. 请求 `version.json` 文件提示 `404 error`。

   上传打包内容到 cdn 服务器：

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === 'production'

   const cdnServerUrl = 'https://foo.com/'

   export default defineConfig({
     base: prod ? cdnServerUrl : '/',
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: cdnServerUrl
       })
     ]
   })
   ```

   在非根目录下部署的项目：

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === 'production'

   const base = '/folder/' // https://example.com/folder/

   export default defineConfig({
     base,
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: base
       })
     ]
   })
   ```

   > After version 1.2.0, you not need to set this option, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config

3. 自定义 `notification` 的刷新和忽略按钮事件。

   ```ts
   // refresh button click event, if you set it, it will cover the default event (location.reload())
   window.pluginWebUpdateNotice_.onClickRefresh = (version) => { alert(`click refresh btn: ${version}`) }

   // dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
   window.pluginWebUpdateNotice_.onClickDismiss = (version) => { alert(`click dismiss btn: ${version}`) }
   ```

4. 自定义 notification 样式。

   你可以通过更高的权重覆盖默认样式。([default css file](https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/public/webUpdateNoticeInjectStyle.css))

   ```html
   <!-- notification html content -->

   <div class="plugin-web-update-notice-anchor">
     <div class="plugin-web-update-notice">
       <div class="plugin-web-update-notice-content" data-cy="notification-content">
         <div class="plugin-web-update-notice-content-title">
           📢  system update
         </div>
         <div class="plugin-web-update-notice-content-desc">
           System update, please refresh the page
         </div>
         <div class="plugin-web-update-notice-tools">
           <a class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn">dismiss</a>
           <a class="plugin-web-update-notice-btn plugin-web-update-notice-refresh-btn">
             refresh
           </a>
         </div>
       </div>
     </div>
   </div>
   ```

5. 手动检测更新

   ```ts
   // vue-router check update before each route change
   router.beforeEach((to, from, next) => {
     window.pluginWebUpdateNotice_.checkUpdate()
     next()
   })
   ```

6. 部分版本不通知。如客户版本是 `v1.0`, 你需要更新 `v1.0.1`, 但不想显示更新提示。

   ```ts
   webUpdateNotice({
     ...
     silence: true
   })
   ```


## 文章
* https://juejin.cn/post/7209234917288886331