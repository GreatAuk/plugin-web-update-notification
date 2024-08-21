# FAQ

1. `TypeScript` intellisense, if you use `window.pluginWebUpdateNotice_.` or listener custom update event。

   ```ts
   // src/shim.d.ts

   // if you use vite plugin
   /// <reference types="@plugin-web-update-notification/vite" />

   // if you use umi plugin
   /// <reference types="@plugin-web-update-notification/umijs" />

   // if you use webpack plugin
   /// <reference types="@plugin-web-update-notification/webpack" />
   ```

2. request `version.json` file get `404 error`.

   If you upload the production files bundled to cdn server:

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === "production";

   const cdnServerUrl = "https://foo.com/";

   export default defineConfig({
     base: prod ? cdnServerUrl : "/",
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: cdnServerUrl,
       }),
     ],
   });
   ```

   Deploy the project in a non-root directory:

   ```ts
   // vite.config.ts

   const prod = process.env.NODE_ENV === "production";

   const base = "/folder/"; // https://example.com/folder/

   export default defineConfig({
     base,
     plugins: [
       vue(),
       webUpdateNotice({
         injectFileBase: base,
       }),
     ],
   });
   ```

   > After version 1.2.0, in most case, you not need to set injectFileBase, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config

3. Custom notification button event.

   ```ts
   // refresh button click event, if you set it, it will cover the default event (location.reload())
   window.pluginWebUpdateNotice_.onClickRefresh = (version) => {
     alert(`click refresh btn: ${version}`);
   };

   // dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
   window.pluginWebUpdateNotice_.onClickDismiss = (version) => {
     alert(`click dismiss btn: ${version}`);
   };
   ```

4. Custom notification style.

   you can cover css styles with higher weights. ([default css file](https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/public/webUpdateNoticeInjectStyle.css))

   ```html
   <!-- notification html content -->

   <div class="plugin-web-update-notice-anchor">
     <div class="plugin-web-update-notice">
       <div
         class="plugin-web-update-notice-content"
         data-cy="notification-content"
       >
         <div class="plugin-web-update-notice-content-title">
           📢 system update
         </div>
         <div class="plugin-web-update-notice-content-desc">
           System update, please refresh the page
         </div>
         <div class="plugin-web-update-notice-tools">
           <a
             class="plugin-web-update-notice-btn plugin-web-update-notice-dismiss-btn"
             >dismiss</a
           >
           <a
             class="plugin-web-update-notice-btn plugin-web-update-notice-refresh-btn"
           >
             refresh
           </a>
         </div>
       </div>
     </div>
   </div>
   ```

5. manual check update.

   ```ts
   // vue-router check update before each route change
   router.beforeEach((to, from, next) => {
     window.pluginWebUpdateNotice_.checkUpdate();
     next();
   });
   ```

6. Some versions do not notify. For example, if the customer version is `v1.0`, you need to update to `v1.0.1`, but do not want to display the update prompt.

   ```ts
   webUpdateNotice({
     ...
     silence: true
   })
   ```