# vite-plugin-web-update-notification

Detect web page updates and notify. 

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "vite-plugin-web-update-notification";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logHash: true,
    }),
  ]
});
```

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "vite-plugin-web-update-notification";

// https://vitejs.dev/config/
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
  ]
});
```

## Options

```ts
function webUpdateNotice(options?: Options): Plugin;

interface Options {
    /** 轮询间隔（ms）, 默认 10 分钟 */
    checkInterval?: number;
    /** 是否在 console 输出 commit-hash */
    logHash?: boolean;
    customNotificationHTML?: string;
    notificationProps?: NotificationProps;
}
interface NotificationProps {
    title?: string;
    description?: string;
    buttonText?: string;
}
```





## License

[MIT](./LICENSE)
