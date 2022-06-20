import { fileURLToPath, URL } from "url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { webUpdateNotice } from "vite-plugin-web-update-notification";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    webUpdateNotice({
      logHash: true,
      notificationProps: {
        // do something
        title: "更新提醒1",
        description: "检测到当前系统版本已更新",
        buttonText: "刷新页面",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
