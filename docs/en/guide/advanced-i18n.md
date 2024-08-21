# internationalization

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      // plugin preset: zh_CN | zh_TW | en_US
      locale: "en_US",
      localeData: {
        en_US: {
          title: "📢 system update",
          description: "System update, please refresh the page",
          buttonText: "refresh",
          dismissButtonText: "dismiss",
        },
        zh_CN: {
          ...
        },
        ...
      },
    }),
  ],
});


// other file to set locale
window.pluginWebUpdateNotice_.setLocale('zh_CN')
```