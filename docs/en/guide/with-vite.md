# Vite

**basic usage**

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "@plugin-web-update-notification/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logVersion: true,
    }),
  ],
});
```

**custom notification text**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      notificationProps: {
        title: "system update",
        description: "System update, please refresh the page",
        buttonText: "refresh",
      },
    }),
  ],
});
```

**internationalization**

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

**hidden default notification, listener to update event and custom behavior.**

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      hiddenDefaultNotification: true,
    }),
  ],
});

// other file to listener update event and custom behavior
document.body.addEventListener("plugin_web_update_notice", (e) => {
  const { version, options } = e.detail;
  // write some code, show your custom notification and etc.
  alert("System update!");
});
```