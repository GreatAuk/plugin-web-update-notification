# Umijs

```ts
// .umirc.ts
import { defineConfig } from "umi";
import type { Options as WebUpdateNotificationOptions } from "@plugin-web-update-notification/umijs";

export default {
  plugins: ["@plugin-web-update-notification/umijs"],
  webUpdateNotification: {
    logVersion: true,
    checkInterval: 0.5 * 60 * 1000,
    notificationProps: {
      title: "system update",
      description: "System update, please refresh the page",
      buttonText: "refresh",
      dismissButtonText: "dismiss",
    },
  } as WebUpdateNotificationOptions,
};
```